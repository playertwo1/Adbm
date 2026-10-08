const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- Teste de Regressão: Modo Treino Flutuante (Floating Workout Overlay) ---');

const rootDir = path.resolve(__dirname, '..');
const manifestPath = path.join(rootDir, 'app', 'src', 'main', 'AndroidManifest.xml');
const htmlPath = path.join(rootDir, 'index.html');
const assetsHtmlPath = path.join(rootDir, 'app', 'src', 'main', 'assets', 'index.html');
const overlayControllerPath = path.join(rootDir, 'app', 'src', 'main', 'java', 'com', 'example', 'WorkoutOverlayController.kt');
const foregroundServicePath = path.join(rootDir, 'app', 'src', 'main', 'java', 'com', 'example', 'WorkoutForegroundService.kt');
const mainActivityPath = path.join(rootDir, 'app', 'src', 'main', 'java', 'com', 'example', 'MainActivity.kt');

// 1. Verificar permissão SYSTEM_ALERT_WINDOW no AndroidManifest.xml
assert(fs.existsSync(manifestPath), 'AndroidManifest.xml não encontrado');
const manifestContent = fs.readFileSync(manifestPath, 'utf8');
assert(
    manifestContent.includes('android.permission.SYSTEM_ALERT_WINDOW'),
    'AndroidManifest.xml deve declarar a permissão SYSTEM_ALERT_WINDOW'
);
console.log('✓ CP1: Permissão SYSTEM_ALERT_WINDOW declarada no AndroidManifest.xml');

// 2. Verificar existência do WorkoutOverlayController.kt
assert(fs.existsSync(overlayControllerPath), 'WorkoutOverlayController.kt não encontrado');
const overlayCode = fs.readFileSync(overlayControllerPath, 'utf8');

// Proibições estritas: não criar outro cronômetro, não criar outro ForegroundService, não criar vibração própria, não duplicar voz
assert(!/:\s*CountDownTimer|new\s+CountDownTimer|object\s*:\s*CountDownTimer/.test(overlayCode), 'WorkoutOverlayController NÃO pode instanciar CountDownTimer próprio');
assert(!/:\s*TextToSpeech|new\s+TextToSpeech/.test(overlayCode), 'WorkoutOverlayController NÃO pode instanciar TextToSpeech');
assert(!/getSystemService.*VIBRATOR_SERVICE|getSystemService\(.*Vibrator::class/.test(overlayCode), 'WorkoutOverlayController NÃO pode disparar vibração própria (Vibrator)');
assert(!overlayCode.includes('Wearable.getMessageClient') && !overlayCode.includes('Wearable.getChannelClient'), 'WorkoutOverlayController NÃO pode duplicar sinais Wearable');
assert(!overlayCode.includes('startForeground('), 'WorkoutOverlayController NÃO pode criar outro ForegroundService');
console.log('✓ CP1/CP2/CP3/CP4: WorkoutOverlayController segue regras proibitivas e delega estritamente ao WorkoutForegroundService');

// 3. Verificar integração com WorkoutForegroundService
assert(fs.existsSync(foregroundServicePath), 'WorkoutForegroundService.kt não encontrado');
const serviceCode = fs.readFileSync(foregroundServicePath, 'utf8');
assert(serviceCode.includes('WorkoutOverlayController.onServiceStateChanged'), 'WorkoutForegroundService deve notificar WorkoutOverlayController sobre mudanças de estado');
assert(serviceCode.includes('WorkoutOverlayController.hideOverlay'), 'WorkoutForegroundService deve ocultar overlay ao encerrar ou destruir o serviço');
console.log('✓ CP2: WorkoutForegroundService é a fonte única de verdade do overlay');

// 4. Verificar métodos expostos na AndroidBridge em MainActivity.kt
assert(fs.existsSync(mainActivityPath), 'MainActivity.kt não encontrado');
const mainActivityCode = fs.readFileSync(mainActivityPath, 'utf8');
assert(mainActivityCode.includes('isOverlayPermissionGranted'), 'MainActivity deve expor isOverlayPermissionGranted');
assert(mainActivityCode.includes('requestOverlayPermission'), 'MainActivity deve expor requestOverlayPermission');
assert(mainActivityCode.includes('getOverlayPreferences'), 'MainActivity deve expor getOverlayPreferences');
assert(mainActivityCode.includes('setOverlayPreferences'), 'MainActivity deve expor setOverlayPreferences');
console.log('✓ CP1/CP5: AndroidBridge expõe API de sobreposição para a WebView');

// 5. Verificar elementos HTML em index.html
assert(fs.existsSync(htmlPath), 'index.html não encontrado');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

assert(htmlContent.includes('id="profileFloatingWorkoutButton"'), 'index.html deve conter botão para abrir ajustes do modo treino flutuante no perfil');
assert(htmlContent.includes('id="floatingWorkoutSettingsModal"'), 'index.html deve conter modal floatingWorkoutSettingsModal');
assert(htmlContent.includes('id="floatingWorkoutToggle"'), 'index.html deve conter toggle floatingWorkoutToggle');
assert(htmlContent.includes('id="floatingWorkoutSizeMini"'), 'index.html deve conter seletor de tamanho mini');
assert(htmlContent.includes('id="floatingWorkoutSizeCompact"'), 'index.html deve conter seletor de tamanho compacto');
assert(htmlContent.includes('id="floatingWorkoutSizeExpanded"'), 'index.html deve conter seletor de tamanho expandido');
assert(htmlContent.includes('id="floatingWorkoutAutoCollapseToggle"'), 'index.html deve conter toggle de recolhimento automático');
assert(htmlContent.includes('id="floatingWorkoutShowNextStepToggle"'), 'index.html deve conter toggle de mostrar próximo passo');
assert(htmlContent.includes('id="floatingWorkoutPermissionBanner"'), 'index.html deve conter banner de permissão');

// 6. Verificar funções JS em index.html
assert(htmlContent.includes('FLOATING_WORKOUT_DEFAULTS'), 'index.html deve definir FLOATING_WORKOUT_DEFAULTS');
assert(htmlContent.includes('normalizeFloatingWorkoutPreferences'), 'index.html deve conter normalizeFloatingWorkoutPreferences');
assert(htmlContent.includes('syncFloatingWorkoutNativePreferences'), 'index.html deve conter syncFloatingWorkoutNativePreferences');
assert(htmlContent.includes('openFloatingWorkoutSettings'), 'index.html deve conter openFloatingWorkoutSettings');
assert(htmlContent.includes('closeFloatingWorkoutSettings'), 'index.html deve conter closeFloatingWorkoutSettings');
assert(htmlContent.includes('toggleFloatingWorkout'), 'index.html deve conter toggleFloatingWorkout');
assert(htmlContent.includes('setFloatingWorkoutDefaultSize'), 'index.html deve conter setFloatingWorkoutDefaultSize');
assert(htmlContent.includes('toggleFloatingWorkoutAutoCollapse'), 'index.html deve conter toggleFloatingWorkoutAutoCollapse');
assert(htmlContent.includes('toggleFloatingWorkoutShowNextStep'), 'index.html deve conter toggleFloatingWorkoutShowNextStep');

// Verificar registro no closeTopmostOverlay
assert(htmlContent.includes("'floatingWorkoutSettingsModal'"), 'floatingWorkoutSettingsModal deve estar registrado em closeTopmostOverlay');

// 7. Verificar persistência de coordenadas (X, Y) no WorkoutOverlayController.kt
assert(overlayCode.includes('KEY_POSITION_X'), 'WorkoutOverlayController deve definir KEY_POSITION_X');
assert(overlayCode.includes('KEY_POSITION_Y'), 'WorkoutOverlayController deve definir KEY_POSITION_Y');
assert(overlayCode.includes('getSavedPosition'), 'WorkoutOverlayController deve conter getSavedPosition');
assert(overlayCode.includes('savePosition'), 'WorkoutOverlayController deve conter savePosition');
console.log('✓ FUTURA 2: Persistência de coordenadas (X, Y) implementada no WorkoutOverlayController');

// 8. Verificar Áudio Ducking nativo no WorkoutForegroundService.kt
assert(serviceCode.includes('AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK'), 'WorkoutForegroundService deve solicitar foco de áudio com atenuação transitória');
assert(serviceCode.includes('requestAudioDucking'), 'WorkoutForegroundService deve conter requestAudioDucking');
assert(serviceCode.includes('releaseAudioDucking'), 'WorkoutForegroundService deve conter releaseAudioDucking');
assert(serviceCode.includes('UtteranceProgressListener'), 'WorkoutForegroundService deve monitorar término da fala via UtteranceProgressListener');
console.log('✓ FUTURA 2: Áudio Ducking nativo implementado no WorkoutForegroundService');

// 9. Verificar paridade estrita entre index.html e app/src/main/assets/index.html
assert(fs.existsSync(assetsHtmlPath), 'app/src/main/assets/index.html não encontrado');
const assetsHtmlContent = fs.readFileSync(assetsHtmlPath, 'utf8');
assert.strictEqual(
    htmlContent,
    assetsHtmlContent,
    'index.html e app/src/main/assets/index.html DEVEM ser estritamente idênticos'
);
console.log('✓ Paridade estrita verificada entre index.html e app/src/main/assets/index.html');

console.log('--- TODOS OS TESTES DE REGRESSÃO DO MODO TREINO FLUTUANTE PASSARAM! ---');
