import React from 'react'

import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import styled from "styled-components";
import background from "../../../login.png";
import formImage from "../../../form.jpg";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


toast.configure();
const LoginPage = () => {

    const usernameRef = useRef();
    const passwordRef = useRef();
    const nameRef = useRef();
    const confirmPasswordRef = useRef();
    const navigate = useNavigate();
    const [register, setRegister] = useState(false);
    const [passwordCheck, setPasswordCheck] = useState(true);
    const [passwordLengthCheck, setPasswordLengthCheck] = useState(true);

    useEffect(() => {
        if(window.sessionStorage.getItem("logged") !== null || window.sessionStorage.getItem("logged") === "success")
            navigate("/home");
    }, []);

    const checkLoginCredentials = () => {
        if(passwordRef.current.value.length === 0 && usernameRef.current.value.length === 0) {
            toast.warning("Introduce your credentials.", {position: toast.POSITION.TOP_CENTER, autoClose: 1500});
            return false;
        }
        else if(passwordRef.current.value.length === 0) {
            toast.warning("Introduce your password.", {position: toast.POSITION.TOP_CENTER, autoClose: 1500});
            return false;
        }
        else if(usernameRef.current.value.length === 0){
            toast.warning("Introduce your username.", {position: toast.POSITION.TOP_CENTER, autoClose: 1500});
            return false;
        } else {
            return true;
        }

    }

    const doLogin = (e) => {
        e.preventDefault();

        if(checkLoginCredentials()) {
            const sessionStorage = window.sessionStorage;
            const headers = {
                "Content-Type": "application/x-www-form-urlencoded",
                "Access-Control-Allow-Origin": "*"
            }
            
        const userDetails = new URLSearchParams();
        userDetails.append("username", usernameRef.current.value);
        userDetails.append("password", passwordRef.current.value);

        axios.post("http://localhost:8081/api/login", userDetails, {headers: headers})
            .then((res) => {
                if(res.data.accessToken)
                    sessionStorage.setItem("accessToken", res.data.accessToken);

                if(res.data.refreshToken)
                    sessionStorage.setItem("refreshToken", res.data.refreshToken);

                const headers = {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}`
                }

                axios.get("http://localhost:8081/api/user/decodeJwt", {headers: headers})
                .then((res) => {
                    if(res.data.role) 
                    sessionStorage.setItem("role", res.data.role);
                    if(res.data.username)
                    sessionStorage.setItem("username", res.data.username);
                    
                    
                    if(sessionStorage.getItem("accessToken") !== null && sessionStorage.getItem("refreshToken") !== null && 
                    sessionStorage.getItem("role") !== null && sessionStorage.getItem("username") !== null) {
                        sessionStorage.setItem("logged", "success");
                        navigate("/home");
                    }
                })
                .catch((e) => {
                    console.log(e);
                });    
            })
            .catch((err) => {
                toast.error("Username or password incorrect", {position: toast.POSITION.TOP_CENTER, autoClose: 1500});
            })
        }
    }
        
    const doRegister = (event) => {
        event.preventDefault();
        if(usernameRef.current.value.length > 0 && nameRef.current.value.length > 0) {
            let userData = {
                username: usernameRef.current.value,
                password: passwordRef.current.value,
                name: nameRef.current.value,
                roleName: "USER"
            }

            const headers = {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }

            axios.post("http://localhost:8081/api/user/save", userData, {headers: headers})
                .then((res) => {
                    setRegister(false);
                })
                .catch((err) => {
                    if(err.response.status === 400)
                        toast.error(err.response.data, {position: toast.POSITION.TOP_CENTER, autoClose: 1500});
                    else
                        toast.error("Could not create account.", {position: toast.POSITION.TOP_CENTER, autoClose: 1500});
                });

                usernameRef.current.value = "";
                nameRef.current.value = "";
                passwordRef.current.value = "";
                confirmPasswordRef.current.value = "";
        }
    }

    const checkPassword = () => {
        if(passwordRef.current.value === confirmPasswordRef.current.value){
            setPasswordCheck(true);
        } else {
            setPasswordCheck(false);
        }
    }

    const checkPasswordLength = () => {
        if(passwordRef.current.value.length < 4 && passwordRef.current.value.length > 0)
            setPasswordLengthCheck(false);
        else
            setPasswordLengthCheck(true);

    }

    const passwordOnFocusOut = () => {
        if(passwordRef.current.value.length > 4 || passwordRef.current.value.length === 0)
            setPasswordLengthCheck(true);
    } 

    const switchForm = () => {
        setPasswordLengthCheck(true);
        setPasswordCheck(true);
        setRegister(!register);
    }

    return (
    <LoginContainer backgroundImage={background}>
        {register ?
        <LoginForm onSubmit={doRegister}>
        <h2>Create Account</h2>
        <div className="form-group">
            <Input ref={usernameRef} 
                   type="text" 
                   name="username" 
                   id="username"
                   placeholder="Username"/>
        </div>
        <div className="form-group">
            <Input ref={nameRef} 
                   type="text" 
                   name="name" 
                   id="name"
                   placeholder="Full Name"/>
        </div>
        <div className="form-group">
            <Input ref={passwordRef} 
                   type="password" 
                   name="password" 
                   id="password" 
                   onChange={checkPasswordLength} 
                   onBlur={passwordOnFocusOut}
                   placeholder="Password"/>
        </div>
            {!passwordLengthCheck && <PasswordCheckLabel>Password is too short</PasswordCheckLabel>}
        <div className="form-group">
            <Input ref={confirmPasswordRef} 
                   type="password" 
                   name="confirm-password" 
                   id="confirm-password" 
                   onChange={checkPassword} 
                   disabled={!passwordLengthCheck} 
                   placeholder="Confirm Password"/>
        </div>
            {!passwordCheck && <PasswordCheckLabel>Passwords must match</PasswordCheckLabel>}
        <SubmitInput type="submit" value="Create" disabled={!passwordCheck} onClick={doRegister}/>
        <Label onClick={switchForm}>Already have an account? Log in</Label>
        </LoginForm>
        :
        <LoginForm onSubmit={doLogin}>
                <h2>Login</h2>
                <div className="form-group">
                    <Input ref={usernameRef} 
                           type="text" 
                           name="username" 
                           id="username"
                           placeholder="Username"/>
                </div>
                <div className="form-group">
                    <Input ref={passwordRef} 
                           type="password" 
                           name="password" 
                           id="password"
                           placeholder="Password"/>
                </div>
                <SubmitInput type="submit" value="Login"/>
                <Label onClick={switchForm}>Not registred? Create an account now</Label>
        </LoginForm>}
    </LoginContainer>
    )
}

export default LoginPage;


const Input = styled.input`
    margin-top: 10px;
    margin-bottom: 20px;
    font-size: 16px;
    outline: none;
    width: 200px;
    border: none;
    border-radius: 10px;
    text-align: center !important;
    border: 4px solid gray;
`;

const SubmitInput = styled.input`
    margin-top: 20px;
    margin-bottom: 20px;
    background: white;
    border-radius: 10px;
    font-size: 20px;
    font-weight: bold;
    color: black;
    cursor: pointer;
    &:hover{
        background-color: black;
        color:white;
        border: 2px solid white;
    }
`;

const LoginForm = styled.form`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background-color: rgb(155, 226, 204);
    width: 640px;
    height: 427px;
    border-radius: 200px;
    * {
        font-family: montserrat, sans-serif;
    }
    border: 4px solid black;
    background-image: url(${formImage});
`;

const LoginContainer = styled.div`
    width: 199.7vh;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    background-image: url(${background});
`;

const PasswordCheckLabel = styled.label`
    color: red;
    font-size: 10px;
`;

const Label = styled.label`
    color: black;
    text-shadow: -0.5px 0 green, 0 0.5px green, 0.5px 0 green, 0 -0.5px green;
    padding-top: 5px;
    padding-bottom: 3px;
    border: 2px solid rgba(0, 0, 0, 0);
    cursor: pointer;
    &:hover{
        background-color: white;
        width: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        border: 2px solid black;
    }
`