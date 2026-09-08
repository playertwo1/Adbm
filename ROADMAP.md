# Próxima etapa: vibração dos exercícios no Galaxy Watch

**Status:** implementação concluída em 08/09/2026; validação física pendente por não haver dispositivo ADB conectado.
**Objetivo:** cada sinal de vibração do exercício no celular também gerar um sinal no relógio, com o menor atraso possível.

1. **Compatibilidade adotada:** Galaxy Watch4 ou mais recente com Wear OS. Relógios Tizen exigem outra implementação.
2. **Mapear eventos existentes:** revisar `MainActivity.kt` (bridge `vibrate`/`vibratePattern` e outros efeitos), `WorkoutForegroundService.kt` e o HTML. Centralizar os sinais dos exercícios para cobrir início, transições e término sem duplicações.
3. **Criar módulo Wear OS:** aplicativo mínimo instalado no relógio, com permissão `VIBRATE`, mesmo applicationId e certificado de assinatura do app do celular. Receber comandos via Wearable Data Layer (`MessageClient`/`WearableListenerService`) e executar padrões compatíveis com o hardware.
4. **Conectar os dispositivos:** descobrir o relógio com o app instalado usando `CapabilityClient`. Enviar eventos com versão do protocolo, sessão, identificador, padrão e prazo curto de validade. Descartar duplicados e eventos atrasados; não reproduzir uma fila antiga ao reconectar. O celular continua funcionando sem relógio.
5. **Adicionar configuração:** opção “Vibrar também no relógio”, estado da conexão e botão de teste. Respeitar a preferência de vibração do usuário; definir e validar o comportamento com Não Perturbe. Pausar/encerrar deve cancelar padrões pendentes em ambos os dispositivos.
6. **Validar em aparelhos reais:** telas apagadas, app em segundo plano, treino completo, desconexão/reconexão, bateria e cancelamento. Medir o atraso entre celular e relógio: meta inicial de até 300 ms em 95% dos sinais com conexão local estável, a confirmar nos testes; não prometer simultaneidade exata.
7. **Entregar depois:** gerar APKs release versionados para celular e relógio, preservar assinatura e dados do celular e documentar instalação, pareamento e teste. Publicar quando a implementação estiver concluída.

**Aceite automatizado concluído:** módulos celular e Wear compilam, usam o mesmo applicationId, versão e certificado; envio é opcional, não bloqueia o treino, descarta mensagens com mais de 5 segundos e elimina duplicações. **Pendente:** confirmar vibração e latência em um Galaxy Watch real.

**Referências:** [Data Layer e requisitos de assinatura](https://developer.android.com/training/wearables/data/overview), [tipos de cliente](https://developer.android.com/training/wearables/data/client-types). Não presumir que o espelhamento de notificações replica os comandos de vibração dos exercícios.

---

# ROADMAP DE IMPLEMENTAÇÃO: PROGRAMA DE 8 SEMANAS DE MINDFULNESS (ATENÇÃO PLENA)
**Projeto:** CoreFlow Android App (`C:\Users\fael\Downloads\Adbm`)  
**Módulo:** Programas de Treinamento (`#tab-programas`) & Player de Áudio Guiado  
**Público-Alvo:** Agente Autônomo / Desenvolvedor (Codex)  
**Versão do Documento:** 1.0.0  
**Status:** PRONTO PARA EXECUÇÃO

---

## 1. Visão Geral e Objetivo

Implementar de ponta a ponta o **Programa de 8 Semanas de Mindfulness (Atenção Plena)** (baseado no protocolo canônico de Mark Williams & Danny Penman / Mindfulness-Based Cognitive Therapy - MBCT) dentro da aba **Programas** do CoreFlow.

O programa é estruturado em:
1. **8 Semanas Progressivas** com práticas formais em áudio (`1track.mp3` a `8track.mp3`) e práticas informais diárias no cotidiano.
2. **Player de Áudio Dedicado com Suporte a Foreground Service**: reprodução contínua mesmo com tela bloqueada ou app em segundo plano, controles de play/pause, scrub de progresso, avanço/retrocesso de 15s.
3. **Acompanhamento e Registro de Hábitos**: contador de sessões diárias (ex: 2x ao dia nas semanas 1-3; 1x formal + 2-3x Espaço de Respiração nas semanas 4-8), checklist de prática informal da semana e streak persistido no `localStorage`.

---

## 2. Inventário e Mapeamento dos Arquivos de Áudio

O usuário possui 8 faixas de áudio no celular. A estrutura de assets no projeto deve ser:
`app/src/main/assets/audio/mindfulness/`

| Arquivo Fonte | Nome Canônico no App | Título da Meditação | Duração Aprox. | Semanas de Uso | Frequência Prescrita |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `1track.mp3` | `1track.mp3` | Meditação do Corpo e da Respiração | ~8 min | Semana 1, Semana 3 (alternada), Semana 7 (opção) | Sem 1: 2x/dia (6 dias/sem) |
| `2track.mp3` | `2track.mp3` | Escaneamento Corporal (Body Scan) | ~14 min | Semana 2, Semana 7 (opção) | Sem 2: 2x/dia (6 dias/sem) |
| `3track.mp3` | `3track.mp3` | Movimento Consciente | ~8 min | Semana 3, Semana 7 (opção) | Sem 3: 1x/dia intercalada |
| `4track.mp3` | `4track.mp3` | Respiração e Movimento Estendido | ~10 min | Semana 3 (opção), Semana 7 (opção) | Suporte |
| `5track.mp3` | `5track.mp3` | Sons e Pensamentos | ~8 min | Semana 4, Semana 7 (opção) | Sem 4: 1x/dia (6 dias/sem) |
| `6track.mp3` | `6track.mp3` | Explorando a Dificuldade | ~10 min | Semana 5, Semana 7 (opção) | Sem 5: 1x/dia (6 dias/sem) |
| `7track.mp3` | `7track.mp3` | Meditação da Amizade e Gentileza | ~10 min | Semana 6, Semana 7 (opção) | Sem 6: 1x/dia (6 dias/sem) |
| `8track.mp3` | `8track.mp3` | Espaço de Respiração de 3 Minutos | ~3 min | Semanas 3, 4, 5, 6, 7, 8 | 2 a 3x ao dia + SOS quando notar tensão |

> **Nota de Compatibilidade:** O player deve suportar tanto caminhos de asset local (`audio/mindfulness/{track}`) quanto seleção via `AndroidBridge` / input file caso o usuário aponte para a pasta de downloads do aparelho.

---

## 3. Matriz Pedagógica das 8 Semanas

### Semana 1: Acordando do Piloto Automático
- **Foco:** Interromper ações mecânicas do cotidiano e perceber o fluxo disperso da mente.
- **Prática Formal:** Áudio 1 (`1track.mp3` - Meditação do Corpo e da Respiração, ~8 min) realizada **2x ao dia**, durante **6 dias** da semana.
- **Prática Informal:** Comer com Atenção Plena (escolher uma refeição ou fruta por dia e saborear texturas, cheiros e mastigação consciente) + quebra de rotina mecânica (ex: sentar em cadeira diferente, escovar os dentes com a mão não dominante).

### Semana 2: Conectando-se ao Corpo
- **Foco:** Reintegração aos sinais físicos, descompressão somática e liberação de tensões acumuladas.
- **Prática Formal:** Áudio 2 (`2track.mp3` - Escaneamento Corporal, ~14 min) realizada **2x ao dia**, durante **6 dias** da semana.
- **Prática Informal:** Executar uma atividade diária comum com foco sensorial total no corpo (ex: sentir a temperatura da água no banho, o toque na louça ou o caminhar até o trabalho).

### Semana 3: O Corpo em Movimento
- **Foco:** Integrar atenção plena ao movimento físico e aprender a pausar nos momentos de agitação.
- **Prática Formal:** Áudio 3 (`3track.mp3` - Movimento Consciente, ~8 min) alternando dias com Áudio 1 (`1track.mp3`), **1x ao dia**, durante **6 dias**.
- **Prática Complementar:** Introdução do Áudio 8 (`8track.mp3` - Espaço de Respiração de 3 Minutos) **2x ao dia** (manhã e tarde).
- **Prática Informal:** Caminhada consciente de 15 a 30 minutos (notando o impacto dos calcanhares, a brisa e o ritmo respiratório).

### Semana 4: Sons e Pensamentos
- **Foco:** Reconhecer que "pensamentos não são fatos" e observar a mente como o céu que acolhe nuvens passageiras.
- **Prática Formal:** Áudio 5 (`5track.mp3` - Sons e Pensamentos, ~8 min) realizada **1x ao dia**, durante **6 dias**.
- **Prática Complementar:** Áudio 8 (`8track.mp3` - Espaço de Respiração) **2x ao dia** em horários programados.
- **Prática Informal:** Notar momentos de ruminação ou preocupação no trabalho e aplicar imediatamente a âncora respiratória.

### Semana 5: Explorando a Dificuldade
- **Foco:** Aprender a virar-se em direção ao desconforto em vez de fugir ou lutar contra ele.
- **Prática Formal:** Áudio 6 (`6track.mp3` - Explorando a Dificuldade, ~10 min) realizada **1x ao dia**, durante **6 dias**.
- **Prática Complementar:** Áudio 8 (`8track.mp3` - Espaço de Respiração de Resposta) no exato instante em que notar estresse agudo, irritação ou frustração.
- **Prática Informal:** Localizar a manifestação física das emoções difíceis (aperto na garganta, peso no estômago, mandíbula travada) e respirar através dessa área.

### Semana 6: Acolhimento e Compaixão
- **Foco:** Dissolver a autocrítica severa e cultivar amabilidade para consigo mesmo e para com os outros.
- **Prática Formal:** Áudio 7 (`7track.mp3` - Meditação da Amizade e Gentileza, ~10 min) realizada **1x ao dia**, durante **6 dias**.
- **Prática Complementar:** Áudio 8 (`8track.mp3` - Espaço de Respiração) **2 a 3x ao dia**.
- **Prática Informal:** Praticar um ato deliberado de gentileza ou apreço genuíno (anônimo ou expresso) a cada dia.

### Semana 7: O Ritmo do Cotidiano
- **Foco:** Integração do mindfulness na rotina de longo prazo; mapeamento de fontes de esgotamento e restauração.
- **Prática Formal:** Escolha pessoal da meditação favorita das semanas anteriores (Áudios 1, 2, 3, 5, 6 ou 7), de 10 a 15 min, **1x ao dia**, durante **6 dias**.
- **Prática Complementar:** Áudio 8 (`8track.mp3` - Espaço de Respiração) **3x ao dia**.
- **Prática Informal:** Mapeamento diário de "Atividades Nutritivas" (que recarregam energia) versus "Atividades Exaustivas" (que drenam), ajustando o dia intencionalmente.

### Semana 8: Sua Vida Selvagem e Preciosa
- **Foco:** Consolidação da autonomia, tecendo a atenção plena como um hábito vivo para o resto da vida.
- **Prática Formal:** Prática pessoal diária (10 a 20 min guiada ou em silêncio ancorada na respiração), **6 dias**.
- **Prática Complementar:** Áudio 8 (`8track.mp3` - Espaço de Respiração) usado sob demanda como recurso de ancoragem contínua.
- **Prática Informal:** Criação do "Plano de Manutenção e Prevenção de Recaída" (identificar sinais precoces de exaustão mental e o protocolo de retorno imediato).

---

## 4. Arquitetura de Dados no `index.html`

### 4.1 Elevação de Versão do Esquema
- No topo dos scripts de `index.html`, atualizar:
  ```javascript
  const CORE_DATA_VERSION = 3; // Anteriormente 2
  ```
- No método `loadSavedState()`:
  - Garantir que a migração adicione o programa `id: '4'` preservando integralmente o progresso dos programas `1` (Bracing), `2` (Kegel) e `3` (Vacuum).
  - Validar a existência do programa `id: '4'` no array `AppState.programs`. Se inexistente, instanciar a estrutura padrão.

### 4.2 Definição do Objeto no `AppState.programs`
Inserir no array inicial de programas:
```javascript
{
  id: '4',
  type: 'mindfulness',
  title: 'Mindfulness 8 Semanas',
  subtitle: 'Atenção Plena & Redução de Estresse (MBCT)',
  icon: 'brain',
  color: '#8B5CF6', // Roxo profundo / violeta meditativo
  gradient: 'linear-gradient(135deg, #7C3AED 0%, #4C1D95 100%)',
  weeklyTargetDays: 6,
  currentPhaseIndex: 0,
  daysCompletedInPhase: 0,
  sessionsToday: 0,
  lastCompletedDate: null,
  reminderEnabled: true,
  reminderTime: '07:30',
  secondaryReminderTime: '15:30', // Para o 2º turno ou Espaço de Respiração
  informalCompletedToday: false,
  phases: [
    {
      weekNumber: 1,
      name: 'Semana 1: Acordando do Piloto Automático',
      description: 'Reconheça a dispersão mecânica do dia a dia e ancore-se no presente.',
      targetSessionsPerDay: 2,
      targetDaysPerWeek: 6,
      formalTrack: 'audio/mindfulness/1track.mp3',
      formalTrackTitle: 'Meditação do Corpo e da Respiração',
      formalTrackDuration: 480, // ~8 minutos em segundos
      secondaryTrack: null,
      informalTitle: 'Refeição Consciente & Quebra de Padrão',
      informalDescription: 'Escolha uma refeição ou fruta para saborear com atenção plena (cheiro, textura, mastigação) e altere um hábito mecânico simples hoje.'
    },
    {
      weekNumber: 2,
      name: 'Semana 2: Conectando-se ao Corpo',
      description: 'Reintegração física e liberação profunda de tensões acumuladas.',
      targetSessionsPerDay: 2,
      targetDaysPerWeek: 6,
      formalTrack: 'audio/mindfulness/2track.mp3',
      formalTrackTitle: 'Escaneamento Corporal (Body Scan)',
      formalTrackDuration: 840, // ~14 min
      secondaryTrack: null,
      informalTitle: 'Atenção Sensorial no Cotidiano',
      informalDescription: 'Execute uma tarefa automática diária (banho, escovar os dentes ou lavar louça) sentindo 100% das sensações físicas em tempo real.'
    },
    {
      weekNumber: 3,
      name: 'Semana 3: O Corpo em Movimento',
      description: 'Atenção em ação e introdução do Espaço de Respiração.',
      targetSessionsPerDay: 1,
      targetDaysPerWeek: 6,
      formalTrack: 'audio/mindfulness/3track.mp3',
      formalTrackTitle: 'Movimento Consciente (ou Áudio 1)',
      formalTrackDuration: 480,
      secondaryTrack: 'audio/mindfulness/8track.mp3',
      secondaryTrackTitle: 'Espaço de Respiração (3 min)',
      secondaryTrackDuration: 180,
      informalTitle: 'Caminhada Consciente',
      informalDescription: 'Caminhe de 15 a 30 minutos prestando atenção nas sensações dos pés tocando o solo, na postura e no contato com o ar.'
    },
    {
      weekNumber: 4,
      name: 'Semana 4: Sons e Pensamentos',
      description: 'Pensamentos não são fatos. Observe o fluxo da mente sem apego.',
      targetSessionsPerDay: 1,
      targetDaysPerWeek: 6,
      formalTrack: 'audio/mindfulness/5track.mp3',
      formalTrackTitle: 'Meditação dos Sons e Pensamentos',
      formalTrackDuration: 480,
      secondaryTrack: 'audio/mindfulness/8track.mp3',
      secondaryTrackTitle: 'Espaço de Respiração (2x ao dia)',
      secondaryTrackDuration: 180,
      informalTitle: 'Pausa Anti-Ruminação',
      informalDescription: 'Sempre que notar uma espiral de preocupações ou julgamentos, pause, faça uma respiração profunda e reconecte-se com o corpo.'
    },
    {
      weekNumber: 5,
      name: 'Semana 5: Explorando a Dificuldade',
      description: 'Acolha o desconforto e aprenda a respirar através das tensões.',
      targetSessionsPerDay: 1,
      targetDaysPerWeek: 6,
      formalTrack: 'audio/mindfulness/6track.mp3',
      formalTrackTitle: 'Explorando a Dificuldade',
      formalTrackDuration: 600, // ~10 min
      secondaryTrack: 'audio/mindfulness/8track.mp3',
      secondaryTrackTitle: 'Espaço de Respiração de Resposta',
      secondaryTrackDuration: 180,
      informalTitle: 'Mapeamento do Desconforto Somático',
      informalDescription: 'Ao vivenciar irritação ou ansiedade, localize onde o corpo está reagindo (peito, garganta, estômago) e acolha sem reagir.'
    },
    {
      weekNumber: 6,
      name: 'Semana 6: Acolhimento e Compaixão',
      description: 'Cultive bondade amorosa, amizade e dissolva a autocrítica.',
      targetSessionsPerDay: 1,
      targetDaysPerWeek: 6,
      formalTrack: 'audio/mindfulness/7track.mp3',
      formalTrackTitle: 'Meditação da Amizade e Gentileza',
      formalTrackDuration: 600,
      secondaryTrack: 'audio/mindfulness/8track.mp3',
      secondaryTrackTitle: 'Espaço de Respiração (2-3x ao dia)',
      secondaryTrackDuration: 180,
      informalTitle: 'Ato Deliberado de Gentileza',
      informalDescription: 'Realize um ato genuíno de gentileza sem esperar nada em troca, prestando atenção em como isso ressoa no seu estado interior.'
    },
    {
      weekNumber: 7,
      name: 'Semana 7: O Ritmo do Cotidiano',
      description: 'Personalize sua prática e mapeie fontes de renovação de energia.',
      targetSessionsPerDay: 1,
      targetDaysPerWeek: 6,
      formalTrack: 'audio/mindfulness/1track.mp3',
      formalTrackTitle: 'Sua Prática Favorita (Áudios 1, 2, 3, 5, 6 ou 7)',
      formalTrackDuration: 600,
      secondaryTrack: 'audio/mindfulness/8track.mp3',
      secondaryTrackTitle: 'Espaço de Respiração (3x ao dia)',
      secondaryTrackDuration: 180,
      informalTitle: 'Atividades Nutritivas vs Exaustivas',
      informalDescription: 'Classifique seus compromissos de hoje entre os que nutrem sua energia e os que drenam. Adicione uma pausa reparadora consciente.'
    },
    {
      weekNumber: 8,
      name: 'Semana 8: Sua Vida Selvagem e Preciosa',
      description: 'Consolidação da autonomia e mindfulness para a vida inteira.',
      targetSessionsPerDay: 1,
      targetDaysPerWeek: 6,
      formalTrack: 'audio/mindfulness/1track.mp3',
      formalTrackTitle: 'Prática Autônoma Consolidada (10-20 min)',
      formalTrackDuration: 600,
      secondaryTrack: 'audio/mindfulness/8track.mp3',
      secondaryTrackTitle: 'Espaço de Respiração SOS',
      secondaryTrackDuration: 180,
      informalTitle: 'Plano de Prevenção de Recaída',
      informalDescription: 'Defina suas 3 âncoras para quando o estresse subir: qual áudio ouvir, como pausar e quem procurar para desacelerar.'
    }
  ]
}
```

---

## 5. Implementação da Interface e do Player de Áudio

### 5.1 Card na Aba Programas (`renderProgramsList()`)
- O card do programa deve renderizar:
  - **Badge de Categoria:** `Mindfulness & Mente` (gradiente roxo/violeta).
  - **Fase Atual:** `Semana X de 8: Nome da Semana`.
  - **Barra de Progresso:** Dias completados / meta semanal (6 dias).
  - **Prática Informal da Semana:** Card colapsável com ícone de lâmpada/folha e botão toggle para marcar se a prática informal de hoje foi concluída.
  - **Ações Rápidas:**
    - Botão primário: **Iniciar Prática Formal** (Abre o Player do Áudio da Semana).
    - Botão secundário (a partir da Semana 3): **Espaço de Respiração (3 min)** (Áudio 8 direto).

### 5.2 Modal do Player de Áudio (`openMindfulnessAudioModal(progId, phaseIdx, trackType)`)
O modal de execução para treinos de mindfulness deve ser otimizado para audição consciente:
- **Design:** Fundo escuro imersivo, gradiente suave, ilustração de onda sonora ou pulsação suave sincronizada com o timer.
- **Controles de Reprodução:**
  - Botão Play / Pause central amplo.
  - Botão Retroceder 15s (`-15s`).
  - Botão Avançar 15s (`+15s`).
  - Barra de Progresso Interativa (Slider/Scrubber) com tempo decorrido e tempo restante.
  - Seletor de Faixa (para Semanas 3 e 7 que oferecem alternância).
- **WakeLock & Background Playback:**
  - Ativar `navigator.wakeLock.request('screen')` enquanto o áudio estiver tocando.
  - Integrar com `AndroidBridge.startWorkoutSession("Mindfulness: " + trackTitle, totalSeconds)` para manter o serviço de primeiro plano ativo e não ser interrompido pelo Doze Mode do Android.
- **Ao Finalizar o Áudio:**
  - Tocar suavemente som de sino tibetano / gongo.
  - Registrar conclusão: incrementar `sessionsToday` e `daysCompletedInPhase`.
  - Disparar confetes ou feedback visual suave de conquista com botão de salvar diário/sensações.

---

## 6. Integração Nativa Android (`MainActivity.kt` & `WorkoutForegroundService.kt`)

1. **Ativos no Projeto:**
   - Criar a pasta: `app/src/main/assets/audio/mindfulness/`
   - Alocar os arquivos `1track.mp3` até `8track.mp3`.
   - Se os arquivos ainda não estiverem na árvore do repositório, o app deve conter um seletor no WebView que permita ao usuário carregar uma vez do armazenamento do celular e salvar no IndexedDB ou cache de arquivos do app.

2. **Permissões e Background Audio:**
   - Garantir que o `AndroidManifest.xml` contenha:
     ```xml
     <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
     <uses-permission android:name="android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK" />
     <uses-permission android:name="android.permission.WAKE_LOCK" />
     ```
   - No `WorkoutForegroundService.kt`:
     - O tipo de serviço deve incluir `mediaPlayback` ou manter a notificação persistente com controle de mídia caso o áudio seja tocado via MediaPlayer nativo ou WebView.

3. **Fallback Resiliente de Áudio no WebView:**
   ```javascript
   function createMindfulnessAudio(trackPath) {
     const audio = new Audio(trackPath);
     audio.preload = 'auto';
     return audio;
   }
   ```

---

## 7. Sistema de Notificações e Lembretes Diários

1. **Lembrete Formal Principal:**
   - Configurado por padrão para as `07:30` (ou customizado pelo usuário).
   - Texto: *"Momento Mindfulness: Sua prática de [Nome da Meditação] espera por você hoje."*
2. **Lembrete do Espaço de Respiração (Semanas 3 a 8):**
   - Configurado para as `15:30` (momento de pico de tensão vespertina).
   - Texto: *"Pausa de 3 Minutos: Saia do piloto automático e respire fundo."*
3. **Persistência via `AndroidBridge.scheduleWorkoutNotification`**.

---

## 8. Roteiro Passo a Passo de Execução para o Codex

### Etapa 1: Preparação e Assets
1. Criar o diretório de assets:
   `app/src/main/assets/audio/mindfulness/`
2. Copiar/alocar as 8 faixas (`1track.mp3` a `8track.mp3`).
3. Verificar a permissão de leitura de assets no `MainActivity.kt`.

### Etapa 2: Atualização do Esquema no `index.html`
1. Incrementar `CORE_DATA_VERSION = 3`.
2. Adicionar a definição canônica do Programa 4 com as 8 semanas completas, metadados de áudio e práticas informais.
3. No `loadSavedState()`, implementar o merge garantindo que se o programa `id === '4'` não existir na lista salva, ele seja inserido sem zerar os outros.

### Etapa 3: Desenvolvimento do Player de Mindfulness no `index.html`
1. Adicionar os estilos CSS para o Player de Áudio Imersivo (`.mindfulness-player-modal`, `.audio-scrubber`, `.pulsing-glow`).
2. Implementar a função `openMindfulnessAudioModal(programId, phaseIndex, isSecondary)`:
   - Carregamento da faixa via HTML5 Audio.
   - Atualização do tempo em tempo real (display `mm:ss` / `-mm:ss`).
   - Listeners para `timeupdate`, `ended`, `error`.
   - Controles de play, pause, avançar 15s, retroceder 15s.
   - Ativação do Foreground Service via `AndroidBridge`.
3. Adicionar o checklist da Prática Informal com botão de marcação diária.

### Etapa 4: Renderização na Aba Programas
1. Atualizar `renderProgramsList()` para reconhecer o `type: 'mindfulness'`.
2. Exibir o card com badge violeta, botões de ação específicos (Prática Formal + Espaço de Respiração) e a dica informal da semana em destaque.

### Etapa 5: Validação e Testes
1. Executar testes de compatibilidade em JavaScript (Node.js/JSDOM ou no navegador).
2. Compilar o app via Gradle:
   `./gradlew.bat assembleRelease`
3. Instalar o APK de release no dispositivo ou emulador e validar:
   - Reprodução das 8 faixas.
   - Continuidade do áudio com tela desligada (Foreground Service).
   - Contagem correta dos 6 dias por semana e avanço de fase.
   - Preservação intacta dos programas 1, 2 e 3.

---

## 9. Critérios de Aceite (Definition of Done)

- [ ] Programa `id: '4'` acessível na aba Programas com todas as 8 semanas detalhadas.
- [ ] Todas as 8 faixas de áudio vinculadas e funcionais no player.
- [ ] O áudio continua tocando com a tela apagada (Foreground Service / WakeLock ativo).
- [ ] O usuário consegue marcar tanto a prática formal quanto a prática informal diária.
- [ ] Migração de versão (`CORE_DATA_VERSION = 3`) preserva os dados existentes sem resetar treinos anteriores.
- [ ] Build Gradle (`assembleRelease`) conclui com sucesso com exit code 0.
- [ ] APK release gerado e pronto para sincronização.
