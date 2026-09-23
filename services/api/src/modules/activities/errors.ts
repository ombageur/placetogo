/** Galat domain untuk aksi ajakan; dipetakan ke status HTTP di routes/activities.ts. */
export class ActivityNotFoundError extends Error {}
export class ForbiddenActivityActionError extends Error {}
export class InvalidActivityStateError extends Error {}
export class ActivityFullError extends Error {}
export class AlreadyJoinedError extends Error {}
export class SelfJoinError extends Error {}
export class ActivityAlreadyStartedError extends Error {}
export class NotJoinedError extends Error {}
export class CapacityBelowParticipantsError extends Error {}
