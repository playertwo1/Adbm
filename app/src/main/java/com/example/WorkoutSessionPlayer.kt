package com.example

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.ExperimentalAnimationApi
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.SkipNext
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay

// --- MODELO DE PASSO A PASSO ---
data class WorkoutStep(
    val title: String,
    val instruction: String,
    val durationSeconds: Int,
    val isRest: Boolean = false
)

@OptIn(ExperimentalAnimationApi::class)
@Composable
fun WorkoutSessionPlayer(
    programName: String,
    phaseName: String,
    steps: List<WorkoutStep>,
    onFinishSession: () -> Unit,
    onCancelSession: () -> Unit
) {
    val context = LocalContext.current
    var currentStepIndex by remember { mutableStateOf(0) }
    var isRunning by remember { mutableStateOf(false) }
    var showCancelDialog by remember { mutableStateOf(false) }
    
    val currentStep = steps.getOrNull(currentStepIndex)
    var timeLeft by remember { mutableStateOf(currentStep?.durationSeconds ?: 0) }

    // Atualiza o tempo quando o passo muda
    LaunchedEffect(currentStepIndex) {
        timeLeft = steps.getOrNull(currentStepIndex)?.durationSeconds ?: 0
    }

    // Motor do Temporizador e Transição de Passos
    LaunchedEffect(isRunning, currentStepIndex) {
        if (isRunning && currentStep != null) {
            // Haptics no início do passo (Pulso forte se for treino, pulso duplo se for descanso)
            if (currentStep.isRest) {
                AdvancedHapticsManager.playRelaxationSignal(context)
            } else {
                AdvancedHapticsManager.playHeavyPulse(context)
            }

            while (timeLeft > 0 && isRunning) {
                delay(1000L)
                timeLeft--
            }

            if (timeLeft == 0 && isRunning) {
                // Avança para o próximo passo
                if (currentStepIndex < steps.size - 1) {
                    currentStepIndex++
                } else {
                    // FIM DO TREINO
                    isRunning = false
                    AdvancedHapticsManager.playSuccessPattern(context)
                    onFinishSession() // Função que vai salvar no banco de dados e fechar a tela
                }
            }
        }
    }

    if (currentStep == null) return // Prevenção de erro se a lista estiver vazia

    Column(
        modifier = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // --- CABEÇALHO ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(onClick = { showCancelDialog = true }) {
                Icon(Icons.Default.Close, contentDescription = "Cancelar", tint = Color.Gray)
            }
            Text("Passo ${currentStepIndex + 1} de ${steps.size}", color = Color.Gray, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.width(48.dp)) // Balanço visual
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        Text(programName, color = MaterialTheme.colorScheme.primary, fontSize = 14.sp, fontWeight = FontWeight.Bold)
        Text(phaseName, color = Color.White, fontSize = 20.sp, fontWeight = FontWeight.Bold)

        Spacer(modifier = Modifier.weight(1f))

        // --- CONTEÚDO DO PASSO ATUAL ---
        AnimatedContent(targetState = currentStepIndex, label = "step_transition") { _ ->
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                // Indicador visual (Verde para exercício, Azul escuro para descanso)
                Box(
                    modifier = Modifier
                        .size(240.dp)
                        .clip(CircleShape)
                        .background(
                            if (currentStep.isRest) Color(0xFF1E293B) else MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = String.format("%02d:%02d", timeLeft / 60, timeLeft % 60),
                            fontSize = 64.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (currentStep.isRest) Color(0xFF38BDF8) else MaterialTheme.colorScheme.primary
                        )
                        Text(
                            text = if (currentStep.isRest) "DESCANSO" else "EM AÇÃO",
                            fontWeight = FontWeight.Bold,
                            color = if (currentStep.isRest) Color(0xFF38BDF8) else MaterialTheme.colorScheme.primary
                        )
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))
                
                Text(
                    text = currentStep.title,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White,
                    textAlign = TextAlign.Center
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = currentStep.instruction,
                    fontSize = 16.sp,
                    color = Color.LightGray,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(horizontal = 16.dp)
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // --- PRÓXIMO PASSO (Preview) ---
        val nextStep = steps.getOrNull(currentStepIndex + 1)
        if (nextStep != null) {
            Card(
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.SkipNext, contentDescription = null, tint = Color.Gray)
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("A seguir:", fontSize = 12.sp, color = Color.Gray)
                        Text(nextStep.title, fontSize = 14.sp, color = Color.White, fontWeight = FontWeight.Bold)
                    }
                }
            }
        }

        // --- CONTROLES PLAY/PAUSE ---
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Button(
                onClick = { isRunning = !isRunning },
                modifier = Modifier.fillMaxWidth().height(60.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (isRunning) Color.DarkGray else MaterialTheme.colorScheme.primary
                )
            ) {
                Icon(if (isRunning) Icons.Default.Close else Icons.Default.PlayArrow, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(if (isRunning) "Pausar" else if (timeLeft == currentStep.durationSeconds) "Iniciar" else "Continuar", fontSize = 18.sp)
            }
        }
    }

    // Modal de Cancelamento (Para não perder o treino por acidente)
    if (showCancelDialog) {
        AlertDialog(
            onDismissRequest = { showCancelDialog = false },
            title = { Text("Cancelar Sessão?") },
            text = { Text("O progresso desta sessão não será salvo. Tem certeza de que precisa interromper agora?") },
            confirmButton = {
                TextButton(onClick = {
                    showCancelDialog = false
                    isRunning = false
                    onCancelSession() // Volta para a tela anterior
                }) {
                    Text("Sim, parar", color = MaterialTheme.colorScheme.error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showCancelDialog = false }) {
                    Text("Continuar Treino", color = MaterialTheme.colorScheme.primary)
                }
            }
        )
    }
}
