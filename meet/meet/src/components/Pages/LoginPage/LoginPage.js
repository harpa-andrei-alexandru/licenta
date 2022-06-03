import React from 'react'

import { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import styled from "styled-components";

function LoginPage() {

    const usernameRef = useRef();
    const passwordRef = useRef();
    const navigate = useNavigate();

    useEffect(() => {
        if(window.localStorage.getItem("logged") !== null || window.localStorage.getItem("logged") === "success")
            navigate("/home");
    }, []);

    const doLogin = (e) => {
        e.preventDefault();
        
        let localStorage = window.localStorage;
        const sessionStorage = window.sessionStorage;
        const headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            "Access-Control-Allow-Origin": "*"
        }

        const userDetails = new URLSearchParams();
        userDetails.append("username", usernameRef.current.value);
        userDetails.append("password", passwordRef.current.value);
        let userData = {}

        axios.post("http://localhost:8081/api/login", userDetails, {headers: headers})
            .then((res) => {
                console.log(res.data);
                if(res.data.accessToken)
                    // localStorage.setItem("accessToken", res.data.accessToken);
                    //userData["accessToken"] = res.data.accessToken;
                    sessionStorage.setItem("accessToken", res.data.accessToken);

                if(res.data.refreshToken)
                    //localStorage.setItem("refreshToken", res.data.refreshToken);
                    //userData["refreshToken"] = res.data.refreshToken;
                    sessionStorage.setItem("refreshToken", res.data.refreshToken);

                const headers = {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*",
                    "Authorization": `Bearer ${sessionStorage.getItem("accessToken")}`
                }

                axios.get("http://localhost:8081/api/user/decodeJwt", {headers: headers})
                    .then((res) => {
                        console.log(res);
                        if(res.data.role) 
                            // localStorage.setItem("role", res.data.role)
                            //userData["role"] = res.data.role;
                            sessionStorage.setItem("role", res.data.role);
                        if(res.data.username)
                            //localStorage.setItem("username", res.data.username)
                            //userData["username"] = res.data.username;
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
                console.log(err);
            })
    }

    return (
    <LoginContainer>
        <LoginForm onSubmit={doLogin}>
                <h2>Login</h2>
                <div className="form-group">
                    <label htmlFor="username">Username: </label>
                    <Input ref={usernameRef} type="text" name="username" id="username"/>
                    {/* <input ref={usernameRef} type="text" name="username" id="username"/> */}
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password: </label>
                    <Input ref={passwordRef} type="password" name="password" id="password"/>
                    {/* <input ref={passwordRef} type="password" name="password" id="password"/> */}
                </div>
                <SubmitInput type="submit" value="Login"/>
                {/* <input type="submit" value="Login"/> */}
        </LoginForm>
    </LoginContainer>
    )
}

export default LoginPage


const Input = styled.input`
    margin-top: 10px;
    margin-bottom: 20px;
    font-size: 20px;
    outline: none;
    width: 60%;
    border: none;
    border-radius: 10px;
    text-align: center !important;
    
`;

const SubmitInput = styled.input`
    margin-top: 20px;
    margin-bottom: 20px;
    background:rgb(189, 231, 218);
    border-radius: 5px;
    font-size: 20px;
`;

const LoginForm = styled.form`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background-color: rgb(155, 226, 204);
    width: 25%;
    height: 60%;
    border-radius: 20px;
    * {
        font-family: montserrat, sans-serif;
    }
`;

const LoginContainer = styled.div`
    width: 100%;
    height: 970px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgb(4, 107, 75);
`