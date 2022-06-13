import React from 'react';
import { useRef, useState, useLayoutEffect } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSlash,
  faPen
} from '@fortawesome/free-solid-svg-icons';


import styled from 'styled-components';

const Whiteboard = ({socket, roomId}) => {
    const canvasRef = useRef();
    const sketchRef = useRef();
    const colorRef = useRef();
    const sizeRef = useRef();
    const [action, setAction] = useState("none");
    const [elements, setElements] = useState([]);
    const [elementType, setElementType] = useState('line');
    const [option, setOption] = useState("drawing");
    const [selectedElement, setSelectedElement] = useState(null);

    useLayoutEffect(() => {
        socket.emit("join-whiteboard", {username: window.sessionStorage.getItem("username"), roomId});
        var sketch_style = getComputedStyle(sketchRef.current);
        canvasRef.current.width = parseInt(sketch_style.getPropertyValue('width'));
        canvasRef.current.height = parseInt(sketch_style.getPropertyValue('height'));

        socket.on('canvas-data', ({elements}) => {
                console.log(elements);
                setElements(elements);
        });

        socket.on('refresh-data', ({ elements }) => {   
            setElements(elements);
        })

        window.addEventListener('resize', () => {
            var sketch_style = getComputedStyle(sketchRef.current);
            console.log(socket.id);
            canvasRef.current.width = parseInt(sketch_style.getPropertyValue('width'));
            canvasRef.current.height = parseInt(sketch_style.getPropertyValue('height'));
            socket.emit("refresh-data", {roomId, username: window.sessionStorage.getItem("username")});
        });
    }, []);

    useLayoutEffect(() => {
        var ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        elements.forEach((element) => {
            drawElement(element, ctx);
        })
    }, [elements]);

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

    const drawElement = (element, context) => {
        context.lineWidth = element.size;
        context.strokeStyle = element.color;
        
        if(element.type === "solidRectangle") {
            drawSolidRectangle(element, context);
        } else if(element.type === "rectangle"){
            drawRectangle(element, context);
        } else if(element.type === "pen") {
            drawFreeLine(element, context);
        }
        else{
            drawLine(element, context);
        }
    }

    const mouseDownEvent = (event) => {
        const { clientX, clientY } = event;
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
        } else {    
            const username = window.sessionStorage.getItem("username");
            const id = elements.filter((element) => element.username === username).length;
            const color = colorRef.current.value;
            const size = sizeRef.current.value
            const element = createElement(clientX, clientY, clientX, clientY, elementType, id, username, color, size);
            setElements((elements) => [...elements, element]);
            setAction("drawing");
        }
    }

    const mouseUpEvent = () => {
            const element = elements[elements.length - 1];
            socket.emit('canvas-data', {element, roomId, username: window.sessionStorage.getItem("username")});        
            setAction("none");
            setSelectedElement(null);
    }

    const mouseMoveEvent = (event) => {
        const { clientX, clientY } = event;

        if(option === "moving") {
            event.target.style.cursor = getElementAtPosition(clientX, clientY) ? "move" : "default";
        }

        if(action === "drawing") {
            const index = elements.length - 1;
            const stateCopy = [...elements];
            const username = window.sessionStorage.getItem("username");

            if(elementType === 'pen') {
                stateCopy[index].points = [...stateCopy[index].points, {x: clientX, y: clientY}];
                socket.emit('canvas-data', {element: stateCopy[index], roomId, username: window.sessionStorage.getItem("username")});  
            } else {
                const {x1, y1} = elements[index];
                const id = stateCopy[index].id;
                const color = colorRef.current.value;
                const size = sizeRef.current.value;
                const element = createElement(x1, y1, clientX, clientY, elementType, id, username, color, size);
                stateCopy[index] = element;
                socket.emit('canvas-data', { element: element, roomId, username }); 
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
                socket.emit('canvas-data', {element: stateCopy[index], roomId, username: window.sessionStorage.getItem("username")});  
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
        stateCopy[index] = updatedElement;

        socket.emit('canvas-data', {element: stateCopy[index], roomId, username: window.sessionStorage.getItem("username")});  
        setElements(stateCopy);
    }

    const createElement = (x1, y1, x2, y2, tool, id, username, color, size) => {
        if(tool === 'pen') {
            return { 
                points: [{ x: x1, y: y1 }], 
                color, 
                size, 
                username,
                type: tool,
                id
            };
        } else {
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

    const distance = (a, b) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

    const getElementAtPosition = (x, y) => {
        return elements.find(element => isWithinElement(x, y, element));
    }

    const selectLine = () => {
        setElementType('line');
    }

    const selectRectangle = () => {
        setElementType('rectangle');
    }

    const selectSolidRectangle = () => {
        setElementType('solidRectangle');
    }

    const selectPen = () => {
        setElementType('pen');
    }

    const selectDrawing = () => {
        setOption("drawing");
    }

    const selectMoving = () => {
        setOption("moving");
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
                        </SelectSize>
                    </div>
                </ElementStyleContainer>
                <ElementsContainer>
                    <LineElement onClick={selectLine} tool={elementType}>
                        <FontAwesomeIcon icon={faSlash} />
                    </LineElement>
                    <RectangleElement onClick={selectRectangle} tool={elementType}>
                        <Rectangle/>
                    </RectangleElement>
                    <SolidRectangleElement onClick={selectSolidRectangle} tool={elementType}>
                        <SolidRectangle/>
                    </SolidRectangleElement>
                    <PenElement onClick={selectPen} tool={elementType}>
                        <FontAwesomeIcon icon={faPen} />
                    </PenElement>
                </ElementsContainer>
                <OptionsContainer>
                    <DrawingOption onClick={selectDrawing} action={option}>
                        Drawing
                    </DrawingOption>
                    <MovingOption onClick={selectMoving} action={option}>
                        Moving
                    </MovingOption>
                </OptionsContainer>
            </ToolbarContainer>
            <CanvasContainer ref={sketchRef} className='sketch' id='sketch'>
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

const LineElement = styled.div`
    margin: 5px;
    border: 2px solid black;
    border-radius: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.tool === 'line' ? "#f6ab43a4" : "#ffffff0"};
    cursor: pointer;
`;

const RectangleElement = styled.div`
    margin: 5px;
    border: 2px solid black;
    border-radius: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.tool === 'rectangle' ? "#f6ab43a4" : "#ffffff0"}; 
    cursor: pointer;
`;

const PenElement = styled.div`
    margin: 5px;
    border: 2px solid black;
    border-radius: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.tool === 'pen' ? "#f6ab43a4" : "#ffffff0"};
    cursor: pointer;
`;

const SolidRectangleElement = styled.div`
    margin: 5px;
    border: 2px solid black;
    border-radius: 10px;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.tool === 'solidRectangle' ? "#f6ab43a4" : "#ffffff0"}; 
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

const OptionsContainer = styled.div`
    width: 33%;
    background-color: #9cdeec8a;
    margin: 10px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: space-around;
`;

const DrawingOption = styled.div`
    width: 70px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    border-radius: 10px;
    background: ${props => props.action === 'drawing' ? "#f6ab43a4" : "#ffffff"};
    cursor: pointer;
    border: 2px solid black;
    font-weight: bold;
`

const MovingOption = styled.div`
    width: 70px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${props => props.action === 'moving' ? "#f6ab43a4" : "#ffffff"};
    border-radius: 10px;
    cursor: pointer;
    border: 2px solid black;
    font-weight: bold;
`
