package com.user.user.exception;


public class UserAlreadyExistsException extends RuntimeException{
    public UserAlreadyExistsException() {
        super("User already exists.");
    }
}
