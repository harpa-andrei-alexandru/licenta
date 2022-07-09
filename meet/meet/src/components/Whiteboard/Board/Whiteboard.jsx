import React, { useEffect } from 'react';
import { useRef, useState, useLayoutEffect } from 'react';
import io from 'socket.io-client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSlash,
  faPen
} from '@fortawesome/free-solid-svg-icons';


import styled from 'styled-components';

const Whiteboard = ({roomId}) => {
    const [action, setAction] = useState("none");
    const [elements, setElements] = useState([]);
    const [elementType, setElementType] = useState('line');
    const [option, setOption] = useState("drawing");
    const [selectedElement, setSelectedElement] = useState(null);

    const canvasRef = useRef();
    const sketchRef = useRef();
    const colorRef = useRef();
    const sizeRef = useRef();
    const textRef = useRef();
    const fontRef = useRef();
    const socketRef = useRef();

    useLayoutEffect(() => {
        socketRef.current = io("http://localhost:5000/");
        socketRef.current.emit("join-whiteboard", {username: window.sessionStorage.getItem("username"), roomId});
        var sketch_style = getComputedStyle(sketchRef.current);
        canvasRef.current.width = parseInt(sketch_style.getPropertyValue('width'));
        canvasRef.current.height = parseInt(sketch_style.getPropertyValue('height'));

        socketRef.current.on('canvas-data', ({elements}) => {
                setElements(elements);
        });

        socketRef.current.on('refresh-data', ({ elements }) => {   
            setElements(elements);
        })

        window.addEventListener('resize', () => {
            var sketch_style = getComputedStyle(sketchRef.current);
            canvasRef.current.width = parseInt(sketch_style.getPropertyValue('width'));
            canvasRef.current.height = parseInt(sketch_style.getPropertyValue('height'));
            socketRef.current.emit("refresh-data", {roomId, username: window.sessionStorage.getItem("username")});
        });
    }, []);

    useLayoutEffect(() => {
        var ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        elements.forEach((element) => {
            drawElement(element, ctx);
        })
    }, [elements]);

    useEffect(() => {
        if(action === "writing") {
            textRef.current.focus();
        }
    }, [action, selectedElement]);

    const drawLine = (element, context) => {
        context.beginPath();
        context.moveTo(element.x1, element.y1 - canvasRef.current.offsetTop);
        context.lineTo(element.x2, element.y2 - canvasRef.current.offsetTop);
        context.closePath();
        context.stroke();
    }

    const drawSolidRectangle = (element, context) => {
        context.moveTo(element.x1, element.y1 - canvasRef.current.offsetTop);
        context.fillStyle = element.color;
        context.fillRect(element.x1, element.y1 - canvasRef.current.offsetTop, element.x2 - element.x1, element.y2 - element.y1);
    }

    const drawRectangle = (element, context) => {
        context.moveTo(element.x1, element.y1 - canvasRef.current.offsetTop);
        context.strokeRect(element.x1, element.y1 - canvasRef.current.offsetTop, element.x2 - element.x1, element.y2 - element.y1);
    }

    const drawFreeLine = (element, context) => {
        context.lineJoin = 'round';
        context.lineCap = 'round';
        context.beginPath();
        for(let i = 1; i < element.points.length; ++i) {
            context.moveTo(element.points[i - 1].x, element.points[i - 1].y - canvasRef.current.offsetTop);
            context.lineTo(element.points[i].x, element.points[i].y - canvasRef.current.offsetTop);
            context.closePath();
            context.stroke();
        }
    }

    const drawText = (element, context) => {
        context.font = `${element.size}px ${element.font}`;
        context.textBaseline = "top";
        context.fillStyle = element.color;
        context.fillText(element.text, element.x1, element.y1 - canvasRef.current.offsetTop);
    }

    const drawEllipse = (element, context) => {
        const {x1, y1, x2, y2} = element;
        const startY = y1 - canvasRef.current.offsetTop;
        const endY = y2 - canvasRef.current.offsetTop;
        
        context.moveTo(x1, startY);
        context.beginPath();
        context.ellipse(x1 + (x2 - x1) / 2, startY + (endY - startY) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, 2 * Math.PI)
        if(element.type === "solidEllipse") {
            context.fillStyle = element.color;
            context.fill();
        }
        context.stroke();
    }

    const drawElement = (element, context) => {
        if(element.type === "solidEllipse" || element.type === "solidRectangle") {
            context.lineWidth = 1;
        } else {
            context.lineWidth = element.size;
        }
        context.strokeStyle = element.color;
        
        if(element.type === "solidRectangle") {
            drawSolidRectangle(element, context);
        } else if(element.type === "rectangle"){
            drawRectangle(element, context);
        } else if(element.type === "pen") {
            drawFreeLine(element, context);
        } else if(element.type === "text") {
            drawText(element, context);
        } else if(element.type === "ellipse" || element.type === "solidEllipse") {
            drawEllipse(element, context);
        } else {
            drawLine(element, context);
        }
    }

    const mouseDownEvent = (event) => {
        if(action === "writing") return;
        const { clientX, clientY } = event;
        const username = window.sessionStorage.getItem("username");
        if(option === "moving") {
            const element = getElementAtPosition(clientX, clientY)
            if(element) {
                if(element.type === "pen") {
                    const xOffsets = element.points.map(point => clientX - point.x);
                    const yOffsets = element.points.map(point => clientY - point.y);

                    setSelectedElement({...element, xOffsets, yOffsets});
                } else {
                    const offsetX = clientX - element.x1
                    const offsetY = clientY - element.y1;
                    setSelectedElement({...element, offsetX, offsetY});
                }
                setAction("moving");
            }
        } else if(option === "deleting") {
            const element = getElementAtPosition(clientX, clientY)
            if(element) {
                const stateCopy = [...elements
                    .filter(e => (e.id !== element.id && element.username === e.username) || e.username !== element.username)
                    .map(e => {
                        if(e.id > element.id && e.username === element.username) {
                            e.id -= 1;
                        }
                        return e;
                    })];
                socketRef.current.emit('delete-element', {element, roomId, username});        
                setElements(stateCopy);
            }
        } else{    
            const id = elements.filter((element) => element.username === username).length;
            const color = colorRef.current.value;
            const size = sizeRef.current.value;
            const font = fontRef.current.value;
            const element = createElement(clientX, clientY, clientX, clientY, elementType, id, username, color, size, font);
            setElements((elements) => [...elements, element]);
            setSelectedElement(element);
            setAction(elementType === "text" ? "writing" : "drawing");
        }
    }

    const mouseUpEvent = () => {
        if(action === "writing") return;
        if(option === "deleting") return;
        const element = elements[elements.length - 1];
        if(element)
            socketRef.current.emit('canvas-data', {element, roomId, username: window.sessionStorage.getItem("username")});        
        setAction("none");
        setSelectedElement(null);
    }

    const mouseMoveEvent = (event) => {
        const { clientX, clientY } = event;

        if(option === "moving") {
            event.target.style.cursor = getElementAtPosition(clientX, clientY) ? "move" : "default";
        } else if(option === "deleting") {
            event.target.style.cursor = getElementAtPosition(clientX, clientY) ? "pointer" : "default";
        }

        if(action === "drawing") {
            const index = elements.length - 1;
            const stateCopy = [...elements];
            const username = window.sessionStorage.getItem("username");

            if(elementType === 'pen') {
                stateCopy[index].points = [...stateCopy[index].points, {x: clientX, y: clientY}];
                socketRef.current.emit('canvas-data', {element: stateCopy[index], roomId, username: window.sessionStorage.getItem("username")});  
            } else {
                const {x1, y1} = elements[index];
                const id = stateCopy[index].id;
                const color = colorRef.current.value;
                const size = sizeRef.current.value;
                const font = fontRef.current.value;
                const element = createElement(x1, y1, clientX, clientY, elementType, id, username, color, size, font);
                stateCopy[index] = element;
                socketRef.current.emit('canvas-data', { element: element, roomId, username }); 
            }
            setElements(stateCopy);
        } else if(action === "moving") {
            if(selectedElement.type === 'pen') {
                const updatedPoints = selectedElement.points.map((_, index) => {
                    return {
                        x: clientX - selectedElement.xOffsets[index],
                        y: clientY - selectedElement.yOffsets[index]
                    }
                })
                const stateCopy = [...elements];
                const index = stateCopy.findIndex(elem => elem.username === selectedElement.username && elem.id === selectedElement.id);
                stateCopy[index].points = updatedPoints;
                setElements(stateCopy);
                socketRef.current.emit('canvas-data', {element: stateCopy[index], roomId, username: window.sessionStorage.getItem("username")});  
            } else {
                const {x1, y1, x2, y2, offsetX, offsetY} = selectedElement;
                const width = x2 - x1;
                const height = y2 - y1;
                const newX = clientX - offsetX;
                const newY = clientY - offsetY;
                updateElement(newX, newY, newX + width, newY + height, selectedElement);
            }
        }
    }

    const updateElement = (x1, y1, x2, y2, element) => {
        const {type, id, username, color, size} = element;
        const stateCopy = [...elements];
        const index = stateCopy.findIndex(elem => elem.username === username && elem.id === id);
        const updatedElement = createElement(x1, y1, x2, y2, type, id, username, color, size);
        if(element.type === 'text') {
            updatedElement.text = element.text;
            updatedElement.font = element.font;
        }
        stateCopy[index] = updatedElement;

        socketRef.current.emit('canvas-data', {element: stateCopy[index], roomId, username: window.sessionStorage.getItem("username")});  
        setElements(stateCopy);
    }

    const createElement = (x1, y1, x2, y2, tool, id, username, color, size, font) => {
        if(tool === 'pen') {
            return { 
                points: [{ x: x1, y: y1 }], 
                color, 
                size, 
                username,
                type: tool,
                id
            };
        } else if(tool === "text") {
            return{
                x1, y1, x2, y2, color, size, username, type: tool, text: "", id, font
            };
        } else{
            return { 
                x1, y1, 
                x2, y2, 
                color, 
                size, 
                username,
                type: tool,
                id
            };
        }
    }

    const isWithinElement = (x, y, element) => {
        const {type, x1, y1, x2, y2} = element;
        if(type === "rectangle" || type === "solidRectangle") {
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            return x >= minX && x <= maxX && y >= minY && y <= maxY;
        } else if(type === "line") {
            return onTheLine(x1, y1, x2, y2, x, y);
        } else if(type === "text") {
            return x >= x1 && x <= x2 && y >= y1 && y <= y2;
        } else if(type === "ellipse" || type === "solidEllipse") {
            const minX = Math.min(x1, x2);
            const minY = Math.min(y1, y2);
            const b = Math.abs(y1 - y2);
            const a = Math.abs(x1 - x2);

            const cX = minX + Math.abs(x2 - x1) / 2;
            const cY = minY + Math.abs(y2 - y1) / 2;

            const value = (Math.pow((x - cX), 2) / Math.pow(a, 2)) + (Math.pow((y - cY), 2) / Math.pow(b, 2));
            return value <= 0.26;

        } else {
            const betweenAnyPoint = element.points.some((point, index) => {
                const nextPoint = element.points[index + 1];
                if(!nextPoint) return false;

                return onTheLine(point.x, point.y, nextPoint.x, nextPoint.y, x, y, 5) !== false;
            })

            return betweenAnyPoint;
        }
    }
    
    const onTheLine = (x1, y1, x2, y2, x, y, distanceArea=1) => {
        const a = {x: x1, y: y1};
        const b = {x: x2, y: y2};
        const c = {x, y};
        const offset = distance(a, b) - (distance(a, c) + distance(b, c));
        return Math.abs(offset) < distanceArea;
    }

    const onBlur = () => {
        const {id, x1, y1, username} = selectedElement;
        setAction("none");
        setSelectedElement(null);
        if(textRef.current.value.length === 0) {
            const stateCopy = [...elements.filter(e => (e.username === username && e.id !== id) || username !== e.username)];
            setElements(stateCopy);
        } else {
            const ctx = canvasRef.current.getContext('2d');
            const metrics = ctx.measureText(textRef.current.value);
            const textW = metrics.width;
            const textH = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
            const stateCopy = [...elements];
            const index = stateCopy.findIndex(elem => elem.username === selectedElement.username && elem.id === selectedElement.id);
            stateCopy[index].text = textRef.current.value;
            stateCopy[index].x2 = x1 + textW;
            stateCopy[index].y2 = y1 + textH;
            setElements(stateCopy);
            socketRef.current.emit('canvas-data', {element: stateCopy[index], roomId, username: window.sessionStorage.getItem("username")});
        }
        
    }

    const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

    const getElementAtPosition = (x, y) => {
        return elements.find(element => isWithinElement(x, y, element));
    }

    const selectLine = () => {
        setOption("drawing");
        setElementType('line');
    }

    const selectRectangle = () => {
        setOption("drawing");
        setElementType('rectangle');
    }

    const selectSolidRectangle = () => {
        setOption("drawing");
        setElementType('solidRectangle');
    }

    const selectPen = () => {
        setOption("drawing");
        setElementType('pen');
    }

    const selectText = () => {
        setOption("drawing");
        setElementType('text');
    }

    const selectEllipse = () => {
        setOption("drawing");
        setElementType('ellipse');
    }

    const selectSolidEllipse = () => {
        setOption("drawing");
        setElementType('solidEllipse');
    }

    const selectDrawing = () => {
        setElementType('line');
        setOption("drawing");
    }

    const selectMoving = () => {
        setElementType('none');
        setOption("moving");
    }

    const selectDeleting = () => {
        setElementType('none');
        setOption("deleting");
    }

    const selectNone = () => {
        setOption("none");
    }

    return (
        <>
            <ToolbarContainer>
                <ElementStyleContainer>
                    <ColorPickerContainer>
                        <InputColor ref={colorRef}id='color' type='color'/>
                    </ColorPickerContainer>

                    <div className='brushSizeContainer'>
                        <SelectSize ref={sizeRef}>
                            <Option value="5">5</Option>
                            <Option value="7">7</Option>
                            <Option value="9">9</Option>
                            <Option value="12">12</Option>
                            <Option value="15">15</Option>
                            <Option value="20">20</Option>
                            <Option value="25">25</Option>
                            <Option value="30">30</Option>
                            <Option value="35">35</Option>
                            <Option value="40">40</Option>
                            <Option value="45">45</Option>
                            <Option value="50">50</Option>
                        </SelectSize>
                    </div>
                    <div>
                        <SelectFont ref={fontRef}>
                            <Option value="arial">Arial</Option>
                            <Option value="brush script mt">Brush Script MT</Option>
                            <Option value="courier new">Courier New</Option>
                            <Option value="garamond">Garamond</Option>
                            <Option value="georgia">Georgia</Option>
                            <Option value="helvetica">Helvetica</Option>
                            <Option value="tahoma">Tahoma</Option>
                            <Option value="times new roman">Times New Roman</Option>
                            <Option value="trebuchet ms">Trebuchet MS</Option>
                            <Option value="verdana">Verdana</Option>
                        </SelectFont>
                    </div>
                </ElementStyleContainer>
                <ElementsContainer>
                    <DrawingElement onClick={selectLine} tool={elementType} element="line">
                        <FontAwesomeIcon icon={faSlash} />
                    </DrawingElement>
                    <DrawingElement onClick={selectRectangle} tool={elementType} element="rectangle">
                        <Rectangle/>
                    </DrawingElement>
                    <DrawingElement onClick={selectSolidRectangle} tool={elementType} element="solidRectangle">
                        <SolidRectangle/>
                    </DrawingElement>
                    <DrawingElement onClick={selectEllipse} tool={elementType} element="ellipse">
                        <Ellipse/>
                    </DrawingElement>
                    <DrawingElement onClick={selectSolidEllipse} tool={elementType} element="solidEllipse">
                        <SolidEllipse/>
                    </DrawingElement>
                    <DrawingElement onClick={selectPen} tool={elementType} element="pen">
                        <FontAwesomeIcon icon={faPen} />
                    </DrawingElement>
                    <DrawingElement onClick={selectText} tool={elementType} element="text">
                        T
                    </DrawingElement>
                </ElementsContainer>
                <OptionsContainer>
                    <ElementOption onClick={selectDrawing} action={option} option={"drawing"}>
                        Drawing
                    </ElementOption>
                    <ElementOption onClick={selectMoving} action={option} option={"moving"}>
                        Moving
                    </ElementOption>
                    <ElementOption onClick={selectDeleting} action={option} option={"deleting"}>
                        Delete
                    </ElementOption>
                </OptionsContainer>
            </ToolbarContainer>
            <CanvasContainer ref={sketchRef} className='sketch' id='sketch'>
                {
                    action === "writing" ? <TextArea    ref={textRef} 
                                                        x={selectedElement.x1} 
                                                        y={selectedElement.y1} 
                                                        font={selectedElement.font} 
                                                        size={selectedElement.size} 
                                                        color={selectedElement.color} 
                                                        onBlur={onBlur}/> : null
                }
                <Canvas 
                    ref={canvasRef} 
                    className='board' 
                    id='board'
                    onMouseDown={mouseDownEvent}
                    onMouseUp={mouseUpEvent}
                    onMouseMove={mouseMoveEvent}>
                </Canvas>
            </CanvasContainer>
        </>
    );
}


export default Whiteboard;

const ToolbarContainer = styled.div`
    display: flex;
    align-items: left;
`;

const ElementStyleContainer = styled.div`
    display: flex;
    align-items: center;
    width: 25%;
    background-color: #9cdeec8a;
    margin: 10px;
    border-radius: 10px;
    justify-content: space-around;
`;

const ColorPickerContainer = styled.div`
    margin-left: 10px;
    margin-right: 10px;
`;

const InputColor = styled.input`
    width: 45px;
    height: 45px;
    border-radius: 50%;
    -webkit-appearance: none;
    &::-webkit-color-swatch {
        border-radius: 40%;
        border: 2px solid black;
    }
    -moz-appearance: none;
    appearance: none;
    border: none;
    background: none;
    cursor: pointer;
`;

const SelectSize = styled.select`
    -webkit-appearance: none;
    -moz-appearance: none;
    -ms-appearance: none;
    appearance: none;
    outline: 0;
    box-shadow: none;
    border: 2px solid black;
    width: 50px;
    height: 30px;
    display: flex;
    text-align-last: center;
    border-radius: 15%;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
`;

const SelectFont = styled.select`
    -webkit-appearance: none;
    -moz-appearance: none;
    -ms-appearance: none;
    appearance: none;
    outline: 0;
    box-shadow: none;
    border: 2px solid black;
    width: 150px;
    height: 30px;
    display: flex;
    text-align-last: center;
    border-radius: 15%;
    font-size: 15px;
    font-weight: bold;
    cursor: pointer;
`;

const Option = styled.option`
    font-size: 15px;
    font-weight: bold;
`;

const ElementsContainer = styled.div`
    width: 40%;
    background-color: #9cdeec8a;
    margin: 10px;
    border-radius: 10px;
    display: flex;
    align-items: left;
`;

const DrawingElement = styled.div`
    margin: 5px;
    border: 2px solid black;
    border-radius: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.tool === props.element ? "#f6ab43a4" : "#ffffff0"}; 
    font-family:times, "Times New Roman";
    font-weight: bold;
    ${props => props.element === "text" ? "font-size: 25px;" : ""}
    cursor: pointer;
`;

const Canvas = styled.canvas`
    border: 1px solid black;
`;

const CanvasContainer = styled.div`
    width:100%;
    height:100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Rectangle = styled.div`
    border: 2px solid black;
    width: 20px;
    height: 15px;
    border-radius: 2px;
`;

const SolidRectangle = styled.div`
    background-color: black;
    width: 22px;
    height: 17px;
    border-radius: 2px;
`

const Ellipse = styled.div`
    border: 2px solid black;
    width: 20px;
    height: 15px;
    border-radius: 75%;
`

const SolidEllipse = styled.div`
    background-color: black;
    width: 22px;
    height: 17px;
    border-radius: 75%;
`

const OptionsContainer = styled.div`
    width: 33%;
    background-color: #9cdeec8a;
    margin: 10px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-around;
`;


const ElementOption = styled.div`
    width: 70px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: 10px;
    background: ${props => props.action === props.option ? "#f6ab43a4" : "#ffffff"};
    cursor: pointer;
    border: 2px solid black;
    font-weight: bold;
`

const TextArea = styled.textarea`
    position: fixed;
    top: ${props => `${props.y}px`};
    left: ${props => `${props.x}px`};
    font-size: ${props => `${props.size}px`};
    color: ${props => `${props.color}`};
    font-family: ${props => `${props.font}`};
    white-space: pre-line;
`