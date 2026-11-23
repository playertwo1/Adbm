package com.example.sloppy

// Deliberately sloppy screen used by tests and evals. Every block maps to lint rules.
import androidx.activity.ComponentActivity
import androidx.compose.material.Divider
import androidx.compose.animation.core.tween
import androidx.compose.material3.*
import androidx.compose.runtime.*

class MainActivity : ComponentActivity() {
    override fun onBackPressed() {
        super.onBackPressed()
    }
}

@Composable
fun HomeScreen(viewModel: HomeViewModel) {
    val state by viewModel.state.collectAsState()
    Scaffold(
        topBar = { TopAppBar(title = { Text("Welcome back, User! 👋") }) },
    ) { _ ->
        Column(Modifier.background(Brush.verticalGradient(listOf(Color(0xFF6750A4), Color(0xFF3F51B5))))) {
            Text("BALANCE".uppercase(), fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.5f))
            Card(Modifier.padding(13.dp).shadow(8.dp)) {
                Card(Modifier.padding(8.dp)) {
                    Text("Nested", modifier = Modifier.height(20.dp))
                }
            }
            IconButton(onClick = {}) {
                Icon(Icons.Default.Search, contentDescription = null)
            }
            Box(Modifier.size(24.dp).clickable { })
            LazyColumn {
                items(state.items) { item -> Text(item.name) }
            }
            val alpha by animateFloatAsState(1f, tween(800))
            Box(Modifier.width(400.dp).blur(12.dp))
        }
    }
}
