# Assinatura e atualização do APK

O APK distribuído pelo workflow `Build APK` é um build `release` assinado com
uma chave persistente. O `applicationId` deve continuar sendo
`com.aistudio.coreflow.vdfpkw` e a mesma chave deve ser usada em todas as
versões futuras para que o Android aceite a atualização sem desinstalação.

## Secrets obrigatórios no GitHub

- `KEYSTORE_BASE64`: conteúdo Base64 completo do arquivo JKS.
- `KEYSTORE_PASSWORD`: senha do arquivo JKS.
- `KEY_ALIAS`: alias da chave dentro do JKS.
- `KEY_PASSWORD`: senha da chave privada.

O workflow valida os quatro valores antes de compilar, restaura o JKS apenas no
diretório temporário do runner e gera `app-release.apk`. O `versionCode` usa o
número crescente da execução do GitHub Actions e o `versionName` segue o formato
`1.1.<número da execução>`.

## Regra de continuidade

Nunca gere uma nova chave para substituir a atual. A perda da chave ou de suas
senhas impede atualizar instalações já assinadas por ela. Builds antigos de
depuração usam outra assinatura; nesse caso, é necessária uma última
desinstalação antes de instalar o primeiro APK `release` deste fluxo.
