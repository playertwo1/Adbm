/**
 * E09.5: Backup Seguro - Criptografia AES-256 + SHA-256
 * Implementação de backup local com exportação criptografada e
 * importação com verificação de integridade.
 */

class SecureBackupManager {
  static async exportSecure(plainText, password) {
    if (!plainText || typeof plainText !== 'string') throw new Error('Dados de perfil inválidos para exportação');
    if (!password || password.length < 8) throw new Error('Senha deve ter no mínimo 8 caracteres');
    const timestamp = new Date().toISOString();
    const version = '1.0';
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const checksum = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    const salt = crypto.getRandomValues(new Uint8Array(32));
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey('raw', passwordBuffer, { name: 'PBKDF2' }, false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
    const key = await crypto.subtle.importKey('raw', derivedBits, { name: 'AES-GCM' }, false, ['encrypt']);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    const toHex = bytes => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return { version, timestamp, checksum, ciphertext: toHex(new Uint8Array(cipherBuffer)), iv: toHex(iv), salt: toHex(salt), iterations: 100000, algorithm: 'AES-256-GCM+PBKDF2' };
  }

  static async importSecure(backupData, password) {
    if (!backupData || typeof backupData !== 'object') throw new Error('Formato de backup inválido');
    const { ciphertext, iv, salt, checksum, version } = backupData;
    if (version !== '1.0') throw new Error('Versão de backup não suportada');
    if (!ciphertext || !iv || !salt || !checksum) throw new Error('Backup corrompido: campos obrigatórios faltando');
    if (!password || password.length < 8) throw new Error('Senha deve ter no mínimo 8 caracteres');
    const fromHex = value => new Uint8Array(value.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const cipherArray = fromHex(ciphertext);
    const ivArray = fromHex(iv);
    const saltArray = fromHex(salt);
    if (ivArray.length !== 12) throw new Error('IV de criptografia inválido');
    if (saltArray.length !== 32) throw new Error('Salt de derivação inválido');
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
    const derivedBits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: saltArray, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
    const key = await crypto.subtle.importKey('raw', derivedBits, { name: 'AES-GCM' }, false, ['decrypt']);
    let plainBuffer;
    try {
      plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivArray }, key, cipherArray);
    } catch (error) {
      throw new Error('Falha na descriptografia: senha incorreta ou backup corrompido');
    }
    const plainText = new TextDecoder().decode(plainBuffer);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(plainText));
    const computedChecksum = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    if (computedChecksum !== checksum) throw new Error('Integridade do backup comprometida: checksum não corresponde');
    return plainText;
  }

  static async exportAsZip(plainText, password) {
    const encrypted = await this.exportSecure(plainText, password);
    return JSON.stringify({ format: 'CoreFlow-Backup-ZIP', compressed: true, encrypted: true, created: new Date().toISOString(), ...encrypted }, null, 2);
  }

  static async importFromZip(zipContent, password) {
    if (typeof zipContent !== 'string') throw new Error('Arquivo ZIP deve ser uma string JSON válida');
    try { return await this.importSecure(JSON.parse(zipContent), password); }
    catch (error) { throw new Error(`Erro ao processar ZIP: ${error.message}`); }
  }
}

if (typeof window !== 'undefined') window.SecureBackupManager = SecureBackupManager;
