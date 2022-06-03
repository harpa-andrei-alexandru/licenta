package com.user.user;

import com.user.user.controller.NewUserRequest;
import com.user.user.model.Role;
import com.user.user.model.User;
import com.user.user.service.UserService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@SpringBootApplication
public class UserApplication {

	public static void main(String[] args) {
		SpringApplication.run(UserApplication.class, args);
	}

	@Bean
	CommandLineRunner run(UserService userService) {
		return args -> {
			userService.saveRole(new Role(null, "ADMIN"));
			userService.saveRole(new Role(null, "USER"));
			userService.saveRole(new Role(null, "MANAGER"));

			userService.saveUser(new NewUserRequest("andy", "1234","Harpa Andrei-Alexandru", "ADMIN"));
			userService.saveUser(new NewUserRequest("letty", "1234","Munteanu Letitia-Ioana", "USER"));
		};
	}

	@Bean
	PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}
}
