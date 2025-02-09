import { Response } from "express";
import { Types } from 'mongoose';

export enum HttpStatus {
    OK = 200,
    CREATED = 201,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    INTERNAL_SERVER_ERROR = 500
}

export function isMongoId(value: string): boolean {
    return Types.ObjectId.isValid(value);
}

export function ObjectId(value: string): Types.ObjectId {
    return new Types.ObjectId(value);
}

export function print(text: string){
    console.log(text);
}

export function exitWithMessage(res: Response, message: string = "Internal Server Error", code: number = HttpStatus.INTERNAL_SERVER_ERROR): void {
    res.status(code).json({ message: message });
}

export function exitWithContent(res: Response, content: any = null, code: number = HttpStatus.OK): void {
    res.status(code).json(content);
}