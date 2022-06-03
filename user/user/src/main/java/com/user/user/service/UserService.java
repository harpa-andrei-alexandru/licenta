package com.user.user.service;

import com.user.user.controller.NewUserRequest;
import com.user.user.model.Role;
import com.user.user.model.User;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface UserService {
    User saveUser(NewUserRequest newUserRequest);
    Role saveRole(Role role);
    String updateUserRole(String username, String roleName);
    User getUser(String username);
    List<User> getUsers();
    User updateUser(String username, Map<Object, Object> fields);
    Optional<Role> getRole(String roleName);
}
