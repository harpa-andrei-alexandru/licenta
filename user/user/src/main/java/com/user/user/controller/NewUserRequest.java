package com.user.user.controller;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public
class NewUserRequest {
    private String username;
    private String password;
    private String name;
    private String roleName;
}
