import React from 'react';
import { useRef, useEffect } from 'react';
import styled from "styled-components";

export const StyledVideo = styled.video`
    border-radius: 20px;
    border: 3px solid rgb(27, 44, 43);
`;

const Video = (props) => {
    const ref = useRef();

    useEffect(() => {
        props.peer.on("stream", stream => {
            ref.current.srcObject = stream;
        })
    }, []);

    return (
        <StyledVideo playsInline autoPlay ref={ref} />
    );
}

export default Video;
