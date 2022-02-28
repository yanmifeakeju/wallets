class ApplicationError extends Error {
  code: number;
  constructor(message: string, code: number) {
    super(message);
    this.code = code;

    Object.setPrototypeOf(this, ApplicationError.prototype);
  }
}

export default ApplicationError;
