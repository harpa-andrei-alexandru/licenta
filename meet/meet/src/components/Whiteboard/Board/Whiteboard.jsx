import React from 'react';
import { useRef, useEffect, useState, useContext } from 'react';

const Whiteboard = ({socket, roomId}) => {
    const canvasRef = useRef();
    const sketchRef = useRef();
    const colorRef = useRef();
    const sizeRef = useRef();
    const mousePosRef = useRef({x: 0, y: 0});
    const lastMousePosRef = useRef({x: 0, y: 0});
    let timeout;

    useEffect(() => {
        socket.emit("join-whiteboard", {username: window.sessionStorage.getItem("username"), roomId});
        var sketch_style = getComputedStyle(sketchRef.current);
        canvasRef.current.width = parseInt(sketch_style.getPropertyValue('width'));
        canvasRef.current.height = parseInt(sketch_style.getPropertyValue('height'));

        addMouseEventListener();
        socket.on('canvas-data', (data) => {
            drawCanvas(data);
        });

        socket.on('refresh-data', ({ image }) => {
            console.log("mancare");
            drawCanvas(image);
        })

        window.addEventListener('resize', () => {
            var sketch_style = getComputedStyle(sketchRef.current);
            console.log(socket.id);
            canvasRef.current.width = parseInt(sketch_style.getPropertyValue('width'));
            canvasRef.current.height = parseInt(sketch_style.getPropertyValue('height'));
            socket.emit("refresh-data", {roomId, username: window.sessionStorage.getItem("username")});
        });
    }, []);

    const drawCanvas = (data) => {
        var image = new Image();
            var ctx = canvasRef.current.getContext('2d');
            image.src=data;
            image.width=500;
            image.height=500;
            image.onload = function() {
                image.height = canvasRef.current.height;
                image.width = canvasRef.current.width;
                ctx.drawImage(image, 0, 0);
            }
            // image.src = data;
    }

    const addMouseEventListener = () => {
        /* Mouse Capturing Work */
        canvasRef.current.addEventListener('mousemove', function(e) {
            lastMousePosRef.current.x = mousePosRef.current.x;
            lastMousePosRef.current.y = mousePosRef.current.y;
    
            mousePosRef.current.x = e.pageX - this.offsetLeft;
            mousePosRef.current.y = e.pageY - this.offsetTop;
        }, false);

        canvasRef.current.addEventListener('mousedown', function(e) {
            canvasRef.current.addEventListener('mousemove', onPaint, false);
        }, false);
    
        canvasRef.current.addEventListener('mouseup', function() {
            canvasRef.current.removeEventListener('mousemove', onPaint, false);
        }, false);

    }

    const onPaint = () => {
        var ctx = canvasRef.current.getContext('2d');
        /* Drawing on canvas */
        ctx.lineWidth = sizeRef.current.value;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = colorRef.current.value;
        ctx.beginPath();
        ctx.moveTo(lastMousePosRef.current.x, lastMousePosRef.current.y);
        ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y);
        ctx.closePath();
        ctx.stroke();

        if(timeout !== undefined) clearTimeout(timeout);
        timeout = setTimeout(function() {
            var base64ImageDate = canvasRef.current.toDataURL("image/png");
            socket.emit('canvas-data', {image: base64ImageDate, roomId, username: window.sessionStorage.getItem("username")});
        }, 100);
    };


    return (
        <div ref={sketchRef} className='sketch' id='sketch'>
            <div className='colorPickerContainer'>
                    Select Brush Color: &nbsp;
                    <input ref={colorRef}id='color' type='color'/>
                </div>

                <div className='brushSizeContainer'>
                    Select Brush Size: &nbsp;
                    <select ref={sizeRef}>
                        <option value="5">5</option>
                        <option value="7">7</option>
                        <option value="9">9</option>
                        <option value="12">12</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                    </select>
                </div>
            <canvas ref={canvasRef} className='board' id='board'></canvas>
        </div>
    );
}


export default Whiteboard;