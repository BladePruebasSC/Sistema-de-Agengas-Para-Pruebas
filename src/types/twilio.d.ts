export interface TwilioMessageData {
    clientName?: string;
    date?: string;
    time?: string;
    service?: string;
    phone?: string;
}

export interface TwilioResponse {
    sid: string;
    status: string;
    error?: any;
}