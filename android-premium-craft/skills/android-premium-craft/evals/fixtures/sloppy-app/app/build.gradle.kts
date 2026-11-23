plugins {
    id("com.android.application") version "8.9.0"
}

android {
    compileSdk = 36
    defaultConfig {
        minSdk = 24
        targetSdk = 36
    }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2026.09.00"))
    implementation("androidx.compose.material3:material3")
    implementation("com.google.accompanist:accompanist-systemuicontroller:0.36.0")
    testImplementation("io.github.takahirom.roborazzi:roborazzi:1.40.0")
}
