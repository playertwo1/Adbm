val releaseSigningVariables = listOf("KEYSTORE_PATH", "KEYSTORE_PASSWORD", "KEY_ALIAS", "KEY_PASSWORD")
fun missingReleaseSigningVariables() = releaseSigningVariables.filter { System.getenv(it).isNullOrBlank() }
val buildVersionCode = System.getenv("BUILD_VERSION_CODE")
val buildVersionName = System.getenv("BUILD_VERSION_NAME")
require((buildVersionCode == null) == (buildVersionName == null)) {
    "BUILD_VERSION_CODE and BUILD_VERSION_NAME must be set together"
}

gradle.taskGraph.whenReady {
    if (allTasks.any { it.path.contains("Release") }) {
        check(missingReleaseSigningVariables().isEmpty()) {
            "Release requires persistent signing variables: ${missingReleaseSigningVariables().joinToString(", ")}"
        }
    }
}

plugins {
    alias(libs.plugins.android.application)
}

android {
    namespace = "com.example.wear"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.aistudio.coreflow.vdfpkw"
        minSdk = 30
        targetSdk = 36
        versionCode = (buildVersionCode ?: providers.gradleProperty("CORE_FLOW_VERSION_CODE").get()).toInt()
        versionName = buildVersionName ?: providers.gradleProperty("CORE_FLOW_VERSION_NAME").get()
    }

    signingConfigs {
        create("release") {
            System.getenv("KEYSTORE_PATH")?.takeIf { it.isNotBlank() }?.let { keystorePath ->
                storeFile = file(keystorePath)
                storePassword = System.getenv("KEYSTORE_PASSWORD")
                keyAlias = System.getenv("KEY_ALIAS")
                keyPassword = System.getenv("KEY_PASSWORD")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.play.services.wearable)
}
