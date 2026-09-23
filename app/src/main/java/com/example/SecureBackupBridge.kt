package com.example

import android.content.Context
import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.ContextCompat
import java.security.MessageDigest
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.spec.SecretKeySpec
import javax.crypto.spec.IvParameterSpec
import org.json.JSONObject

/**
 * E09.5: SecureBackupBridge - Backup criptografado com AES-256-CBC + SHA-256
 * Implementa exportação segura, importação com verificação de integridade
 * e persistência em localStorage/SharedPreferences.
 */
object SecureBackupBridge {
    
    private const val ALGORITHM = "AES"
    private const val TRANSFORMATION = "AES/CBC/PKCS5Padding"
    private const val PBKDF2_ITERATIONS = 100000
    private const val KEY_SIZE = 256
    private const val IV_SIZE = 16
    
    /**
     * Exporta snapshot de progresso criptografado com AES-256-CBC
     * Retorna JSON com { ciphertext, iv, salt, checksum, timestamp, version }
     */
    fun exportSecureSnapshot(context: Context, plainJson: String, password: String): String {
        return try {
            require(plainJson.isNotEmpty()) { "Dados vazios" }
            require(password.length >= 8) { "Senha muito curta" }
            
            // Validar JSON
            JSONObject(plainJson)
            
            // 1. Calcular SHA-256 checksum
            val plainBytes = plainJson.toByteArray(Charsets.UTF_8)
            val checksum = plainBytes.sha256Hex()
            
            // 2. Gerar salt aleatório (32 bytes)
            val saltBytes = ByteArray(32)
            SecureRandom().nextBytes(saltBytes)
            val saltHex = saltBytes.toHex()
            
            // 3. Derivar chave com PBKDF2
            val secretKey = deriveKeyPbkdf2(password, saltBytes)
            
            // 4. Gerar IV aleatório (16 bytes para CBC)
            val ivBytes = ByteArray(IV_SIZE)
            SecureRandom().nextBytes(ivBytes)
            val ivHex = ivBytes.toHex()
            
            // 5. Criptografar com AES-256-CBC
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, IvParameterSpec(ivBytes))
            val cipherBytes = cipher.doFinal(plainBytes)
            val ciphertextHex = cipherBytes.toHex()
            
            // 6. Criar resultado JSON
            val result = JSONObject().apply {
                put("version", "1.0")
                put("algorithm", "AES-256-CBC+PBKDF2")
                put("timestamp", System.currentTimeMillis())
                put("checksum", checksum)
                put("ciphertext", ciphertextHex)
                put("iv", ivHex)
                put("salt", saltHex)
                put("iterations", PBKDF2_ITERATIONS)
            }
            
            result.toString()
        } catch (e: Exception) {
            JSONObject().apply {
                put("error", e.message ?: "Erro ao criptografar")
            }.toString()
        }
    }
    
    /**
     * Importa e descriptografa snapshot com verificação de integridade
     */
    fun importSecureSnapshot(encryptedJson: String, password: String): String {
        return try {
            require(encryptedJson.isNotEmpty()) { "Arquivo vazio" }
            require(password.length >= 8) { "Senha muito curta" }
            
            val data = JSONObject(encryptedJson)
            
            val version = data.optString("version", "")
            require(version == "1.0") { "Versão incompatível: $version" }
            
            val checksum = data.optString("checksum")
            val ciphertextHex = data.optString("ciphertext")
            val ivHex = data.optString("iv")
            val saltHex = data.optString("salt")
            
            require(checksum.isNotEmpty()) { "Checksum faltando" }
            require(ciphertextHex.isNotEmpty()) { "Ciphertext faltando" }
            require(ivHex.isNotEmpty()) { "IV faltando" }
            require(saltHex.isNotEmpty()) { "Salt faltando" }
            
            // 1. Converter hex para bytes
            val cipherBytes = ciphertextHex.fromHex()
            val ivBytes = ivHex.fromHex()
            val saltBytes = saltHex.fromHex()
            
            require(ivBytes.size == IV_SIZE) { "IV inválido" }
            require(saltBytes.size == 32) { "Salt inválido" }
            
            // 2. Derivar chave com PBKDF2
            val secretKey = deriveKeyPbkdf2(password, saltBytes)
            
            // 3. Descriptografar
            val cipher = Cipher.getInstance(TRANSFORMATION)
            cipher.init(Cipher.DECRYPT_MODE, secretKey, IvParameterSpec(ivBytes))
            val plainBytes = cipher.doFinal(cipherBytes)
            val plainJson = String(plainBytes, Charsets.UTF_8)
            
            // 4. Validar JSON e checksum
            val parsed = JSONObject(plainJson)
            val computedChecksum = plainBytes.sha256Hex()
            
            require(computedChecksum == checksum) { "Checksum não corresponde: backup corrompido" }
            
            plainJson
        } catch (e: Exception) {
            throw IllegalArgumentException("Falha ao descriptografar: ${e.message}")
        }
    }
    
    /**
     * Salva snapshot criptografado em arquivo Downloads
     */
    fun saveEncryptedBackupToDownloads(context: Context, encryptedJson: String): String {
        return try {
            val fileName = "coreflow-backup-${System.currentTimeMillis()}.cbk"
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val values = ContentValues().apply {
                    put(MediaStore.Downloads.DISPLAY_NAME, fileName)
                    put(MediaStore.Downloads.MIME_TYPE, "application/octet-stream")
                    put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                }
                val uri = requireNotNull(context.contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values))
                context.contentResolver.openOutputStream(uri)?.use { 
                    it.write(encryptedJson.toByteArray(Charsets.UTF_8))
                } ?: error("Stream indisponível")
                "Backup criptografado salvo em Downloads: $fileName"
            } else {
                val folder = requireNotNull(context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS))
                folder.mkdirs()
                java.io.File(folder, fileName).writeText(encryptedJson)
                "Backup criptografado salvo em ${folder.absolutePath}/$fileName"
            }
        } catch (e: Exception) {
            "Erro ao salvar backup: ${e.message}"
        }
    }
    
    // ============= Utilities =============
    
    private fun deriveKeyPbkdf2(password: String, salt: ByteArray): SecretKeySpec {
        val spec = javax.crypto.spec.PBEKeySpec(
            password.toCharArray(),
            salt,
            PBKDF2_ITERATIONS,
            KEY_SIZE
        )
        val factory = javax.crypto.SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val derivedKey = factory.generateSecret(spec).encoded
        return SecretKeySpec(derivedKey, 0, derivedKey.size, ALGORITHM)
    }
    
    private fun ByteArray.sha256Hex(): String {
        val digest = MessageDigest.getInstance("SHA-256")
        val hashBytes = digest.digest(this)
        return hashBytes.toHex()
    }
    
    private fun ByteArray.toHex(): String {
        return this.joinToString("") { "%02x".format(it) }
    }
    
    private fun String.fromHex(): ByteArray {
        check(length % 2 == 0) { "Hex string de comprimento ímpar" }
        return ByteArray(length / 2) { i ->
            substring(i * 2, i * 2 + 2).toInt(16).toByte()
        }
    }
}
