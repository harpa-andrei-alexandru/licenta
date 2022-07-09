package com.user.user.service;

import com.user.user.controller.NewUserRequest;
import com.user.user.exception.UserAlreadyExistsException;
import com.user.user.exception.UserNotFoundException;
import com.user.user.model.Role;
import com.user.user.model.User;
import com.user.user.model.repository.RoleRepository;
import com.user.user.model.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.ReflectionUtils;

import javax.transaction.Transactional;
import java.lang.reflect.Field;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;


@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserServiceImplementation implements UserService, UserDetailsService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;


    @Override
    public User saveUser(NewUserRequest newUserRequest) {
        log.info("Saving new user to the database.");
        Optional<Role> role = roleRepository.findByRoleName(newUserRequest.getRoleName());
        Optional<User> u = userRepository.findById(newUserRequest.getUsername());
        if(u.isPresent()) {
            throw new UserAlreadyExistsException();
        }
        User user = new User(newUserRequest.getUsername(),
                newUserRequest.getName(),
                role.get(),
                passwordEncoder.encode(newUserRequest.getPassword()));
        return userRepository.save(user);
    }

    @Override
    public Role saveRole(Role role) {
        log.info("Saving new role {} to the database.", role.getRoleName());
        return roleRepository.save(role);
    }

    @Override
    public String updateUserRole(String username, String roleName) {
        Optional<User> user = userRepository.findById(username);

        if(user.isEmpty())
            return "User " + username + " not found.";

        Optional<Role> role = roleRepository.findByRoleName(roleName);
        if(role.isEmpty())
            return "Role " + roleName + " not found.";

        user.get().setRole(role.get());
        return "User role updated!";
    }

    @Override
    public User getUser(String username) {
        Optional<User> user = userRepository.findById(username);
        if(user.isEmpty())
            throw new UserNotFoundException(username);

        return user.get();
    }

    @Override
    public List<User> getUsers() {
        return userRepository.findAll();
    }

    @Override
    public User updateUser(String username, Map<Object, Object> fields) {
        Optional<User> user = userRepository.findById(username);

        fields.forEach((key, value) -> {
            Field field = ReflectionUtils.findField(User.class, (String) key);
            assert field != null;
            field.setAccessible(true);
            ReflectionUtils.setField(field, user.get(), value);
        });

        return userRepository.save(user.get());
    }

    @Override
    public Optional<Role> getRole(String roleName) {
        return roleRepository.findByRoleName(roleName);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Optional<User> user = userRepository.findById(username);

        if(user.isEmpty()){
            throw new UsernameNotFoundException("User not found in the database.");
        }

        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(user.get().getRole().getRoleName());
        return new org.springframework.security.core.userdetails.User(user.get().getId(),
                                                                        user.get().getPassword(),
                                                                        Collections.singleton(authority));
    }
}
