#Requires -Version 5.1
[CmdletBinding(SupportsShouldProcess=$true)]
param(
    [Parameter(Mandatory=$true)][string]$ProjectPath,
    [string[]]$Providers = @('codex'),
    [switch]$Force
)
$ErrorActionPreference = 'Stop'
$Project = (Resolve-Path -LiteralPath $ProjectPath).Path
$Source = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
if (-not (Test-Path -LiteralPath $Project -PathType Container)) {
    throw 'ProjectPath deve ser uma pasta existente.'
}
$Roots = @{
    codex = '.agents/skills'
    claude = '.claude/skills'
    antigravity = '.agent/skills'
    gemini = '.gemini/skills'
}
# Validate the entire request and payload before touching any installation.
$Selected = @($Providers | ForEach-Object { $_.Trim().ToLowerInvariant() } | Select-Object -Unique)
if ($Selected.Count -eq 0) { throw 'Informe pelo menos um provedor.' }
foreach ($Provider in $Selected) {
    if (-not $Roots.ContainsKey($Provider)) { throw "Provedor inválido: $Provider" }
}
$Files = @('SKILL.md','README.md','CHANGELOG.md','requirements.txt','LICENSE','.gitignore','.gitattributes','manifest.json','SHA256SUMS.txt')
$Folders = @('references','workflows','scripts','maestro','templates','docs','tests')
foreach ($Name in $Files) {
    if (-not (Test-Path -LiteralPath (Join-Path $Source $Name) -PathType Leaf)) {
        throw "Arquivo obrigatório ausente: $Name. Baixe o kit completo."
    }
}
foreach ($Name in $Folders) {
    if (-not (Test-Path -LiteralPath (Join-Path $Source $Name) -PathType Container)) {
        throw "Pasta obrigatória ausente: $Name. Baixe o kit completo."
    }
}
function Assert-SafeTarget([string]$Target) {
    $Full = [IO.Path]::GetFullPath($Target)
    $ProjectPrefix = $Project.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if (-not $Full.StartsWith($ProjectPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Destino fora do projeto: $Full"
    }
    $TargetPrefix = $Full.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
    if ($Source.Equals($Full, [StringComparison]::OrdinalIgnoreCase) -or $Source.StartsWith($TargetPrefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Origem está dentro do destino; execute o instalador a partir de uma cópia separada do kit.'
    }
    $Cursor = $Full
    while ($Cursor) {
        $Item = Get-Item -LiteralPath $Cursor -Force -ErrorAction SilentlyContinue
        if ($Item -and ($Item.Attributes -band [IO.FileAttributes]::ReparsePoint)) {
            throw "Link ou junction no caminho de instalação: $Cursor"
        }
        if ($Cursor.Equals($Project, [StringComparison]::OrdinalIgnoreCase)) { break }
        $Cursor = Split-Path -Parent $Cursor
    }
    if ((Test-Path -LiteralPath $Full) -and -not (Test-Path -LiteralPath $Full -PathType Container)) {
        throw "Destino existe e não é uma pasta: $Full"
    }
    return $Full
}
$Targets = @{}
function Get-PayloadHash([string]$Path) {
    $Hasher = [Security.Cryptography.SHA256]::Create()
    $Stream = [IO.File]::OpenRead($Path)
    try { return [BitConverter]::ToString($Hasher.ComputeHash($Stream)) }
    finally { $Stream.Dispose(); $Hasher.Dispose() }
}
foreach ($Provider in $Selected) {
    $Targets[$Provider] = Assert-SafeTarget (Join-Path (Join-Path $Project $Roots[$Provider]) 'impeccable-mobile')
}
foreach ($Provider in $Selected) {
    $TargetDir = $Targets[$Provider]
    if ((Test-Path -LiteralPath $TargetDir) -and -not $Force) {
        Write-Host "Ignorando instalação já existente: $TargetDir (use -Force para atualizar com backup)"
        continue
    }
    if (-not $PSCmdlet.ShouldProcess($TargetDir, 'Instalar skill; preservar versão anterior em backup se existir')) { continue }
    # Keep staging/backups outside skill discovery directories.
    $Suffix = [Guid]::NewGuid().ToString('N')
    $Stage = Join-Path $Project ".impeccable-mobile/install-staging/$Provider-$Suffix"
    $Backup = Join-Path $Project ".impeccable-mobile/install-backups/$Provider-$Suffix"
    Assert-SafeTarget $Stage | Out-Null
    Assert-SafeTarget $Backup | Out-Null
    New-Item -ItemType Directory -Path $Stage -Force | Out-Null
    $BackedUp = $false
    try {
        foreach ($Name in $Files) {
            Copy-Item -LiteralPath (Join-Path $Source $Name) -Destination $Stage -Force
        }
        foreach ($Name in $Folders) {
            Copy-Item -LiteralPath (Join-Path $Source $Name) -Destination $Stage -Recurse -Force
        }
        # Validate the copied payload before moving any previous version.
        foreach ($Copied in Get-ChildItem -LiteralPath $Stage -File -Recurse -Force) {
            $Relative = $Copied.FullName.Substring($Stage.Length).TrimStart([IO.Path]::DirectorySeparatorChar)
            $Original = Join-Path $Source $Relative
            if ((Get-PayloadHash $Copied.FullName) -ne (Get-PayloadHash $Original)) {
                throw "Falha ao verificar cópia: $Relative"
            }
        }
        # Recheck immediately before renaming a previous installation.
        Assert-SafeTarget $TargetDir | Out-Null
        if (Test-Path -LiteralPath $TargetDir) {
            New-Item -ItemType Directory -Path (Split-Path -Parent $Backup) -Force | Out-Null
            Move-Item -LiteralPath $TargetDir -Destination $Backup
            $BackedUp = $true
        }
        New-Item -ItemType Directory -Path (Split-Path -Parent $TargetDir) -Force | Out-Null
        Move-Item -LiteralPath $Stage -Destination $TargetDir
    } catch {
        if ($BackedUp -and -not (Test-Path -LiteralPath $TargetDir)) {
            Move-Item -LiteralPath $Backup -Destination $TargetDir
        }
        Write-Warning "Falha de instalação. Cópia temporária preservada para inspeção, se existir: $Stage"
        throw
    }
    Write-Host "Skill instalada em $TargetDir"
    if ($BackedUp) { Write-Host "Backup preservado em $Backup" }
}
Write-Host 'Instale a skill Impeccable oficial separadamente: npx impeccable install'
Write-Host 'Depois recarregue o agente. Verifique localmente adb e maestro.'
Write-Host 'Antes de gerar evidências na raiz do app, inclua .impeccable-mobile/ no .gitignore do app.'
