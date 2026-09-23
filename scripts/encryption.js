/**
 * E09.5: Backup Seguro - Criptografia AES-256 + SHA-256
 * Implementação de backup local com exportação criptografada e
 * importação com verificação de integridade.
 */

class SecureBackupManager {
  /**
   * Exporta dados de perfil com criptografia AES-256 + checksum SHA-256.
   * Retorna: { ciphertext, iv, salt, checksum, timestamp, version }
   */
  static async exportSecure(plainText, password) {
    if (!plainText || typeof plainText !== 'string') {
      throw new Error('Dados de perfil inválidos para exportação');
    }
    if (!password || password.length < 8) {
      throw new Error('Senha deve ter no mínimo 8 caracteres');
    }

    // Timestamp e versão
    const timestamp = new Date().toISOString();
    const version = '1.0';

    // 1. Calcular SHA-256 checksum dos dados originais
    const encoder = new TextEncoder();
    const data = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const checksum = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // 2. Gerar salt aleatório (32 bytes)
    const salt = crypto.getRandomValues(new Uint8Array(32));

    // 3. Derivar chave AES-256 com PBKDF2 (100000 iterações)
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const key = await crypto.subtle.importKey(
      'raw',
      derivedBits,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // 4. Gerar IV aleatório (12 bytes para GCM)
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // 5. Criptografar com AES-256-GCM
    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      data
    );

    const ciphertext = Array.from(new Uint8Array(cipherBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const saltHex = Array.from(salt)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const ivHex = Array.from(iv)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    return {
      version,
      timestamp,
      checksum,
      ciphertext,
      iv: ivHex,
      salt: saltHex,
      iterations: 100000,
      algorithm: 'AES-256-GCM+PBKDF2'
    };
  }

  /**
   * Importa e descriptografa backup com verificação de integridade.
   * Retorna: plainText descriptografado
   */
  static async importSecure(backupData, password) {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Formato de backup inválido');
    }

    const { ciphertext, iv, salt, checksum, version } = backupData;

    if (!version || version !== '1.0') {
      throw new Error('Versão de backup não suportada');
    }

    if (!ciphertext || !iv || !salt || !checksum) {
      throw new Error('Backup corrompido: campos obrigatórios faltando');
    }

    if (!password || password.length < 8) {
      throw new Error('Senha deve ter no mínimo 8 caracteres');
    }

    // 1. Converter hex strings para Uint8Array
    const cipherArray = new Uint8Array(ciphertext.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const ivArray = new Uint8Array(iv.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
    const saltArray = new Uint8Array(salt.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

    if (ivArray.length !== 12) {
      throw new Error('IV de criptografia inválido');
    }

    if (saltArray.length !== 32) {
      throw new Error('Salt de derivação inválido');
    }

    // 2. Derivar chave AES-256 com PBKDF2
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: saltArray,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      256
    );

    const key = await crypto.subtle.importKey(
      'raw',
      derivedBits,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // 3. Descriptografar com AES-256-GCM
    let plainBuffer;
    try {
      plainBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: ivArray
        },
        key,
        cipherArray
      );
    } catch (error) {
      throw new Error('Falha na descriptografia: senha incorreta ou backup corrompido');
    }

    const plainText = new TextDecoder().decode(plainBuffer);

    // 4. Verificar checksum SHA-256
    const plainData = encoder.encode(plainText);
    const hashBuffer = await crypto.subtle.digest('SHA-256', plainData);
    const computedChecksum = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (computedChecksum !== checksum) {
      throw new Error('Integridade do backup comprometida: checksum não corresponde');
    }

    return plainText;
  }

  /**
   * Compacta e criptografa em formato ZIP com proteção.
   * Simula estrutura de ZIP criptografado (sem dependências externas).
   */
  static async exportAsZip(plainText, password) {
    const encrypted = await this.exportSecure(plainText, password);
    
    // Criar metadados do "ZIP"
    const metadata = {
      format: 'CoreFlow-Backup-ZIP',
      compressed: true,
      encrypted: true,
      created: new Date().toISOString(),
      ...encrypted
    };

    return JSON.stringify(metadata, null, 2);
  }

  /**
   * Importa e valida arquivo ZIP criptografado.
   */
  static async importFromZip(zipContent, password) {
    if (typeof zipContent === 'string') {
      try {
        const metadata = JSON.parse(zipContent);
        return await this.importSecure(metadata, password);
      } catch (error) {
        throw new Error(`Erro ao processar ZIP: ${error.message}`);
      }
    }
    throw new Error('Arquivo ZIP deve ser uma string JSON válida');
  }
}

// Exportar para uso no index.html
if (typeof window !== 'undefined') {
  window.SecureBackupManager = SecureBackupManager;
}
