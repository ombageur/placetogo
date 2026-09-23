export class ConversationNotFoundError extends Error {
  constructor(message = 'Percakapan tidak ditemukan.') {
    super(message);
    this.name = 'ConversationNotFoundError';
  }
}

export class ForbiddenConversationActionError extends Error {
  constructor(message = 'Kamu bukan anggota percakapan ini.') {
    super(message);
    this.name = 'ForbiddenConversationActionError';
  }
}
