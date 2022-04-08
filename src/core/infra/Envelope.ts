export class Envelope<T> {
    public result: T | null;
    public errorMessage: string | null;
    public timeGenerated: Date;

    public constructor(result: T | null, errorMessage: string | null) {
        this.result = result;
        this.errorMessage = errorMessage;
        this.timeGenerated = new Date();

        Object.freeze(this);
    }

    public static ok<U> (result: U) : Envelope<U> {
        return new Envelope<U>(result || null, null);
    }

    public static error<U> (errorMessage: string) : Envelope<U> {
        return new Envelope<U>(null, errorMessage);
    }
}