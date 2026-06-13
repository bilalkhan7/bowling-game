package com.europace.bowling.exception;

public class InvalidRollException extends RuntimeException {
    public InvalidRollException(String message) {
        super(message);
    }
}