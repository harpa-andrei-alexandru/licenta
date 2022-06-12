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
    const [action, setAction] = useState(false);
    const [elements, setElements] = useState([]);
    const [elementType, setElementType] = useState('line');

    useLayoutEffect(() => {
        socket.emit("join-whiteboard", {username: window.sessionStorage.getItem("username"), roomId});
        var sketch_style = getComputedStyle(sketchRef.current);
        canvasRef.current.width = parseInt(sketch_style.getPropertyValue('width'));
        canvasRef.current.height = parseInt(sketch_style.getPropertyValue('height'));

        socket.on('canvas-data', ({element}) => {
                setElements((elements) => [...elements, element]);
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
        setAction(true);
        const { clientX, clientY } = event;
        const username = window.sessionStorage.getItem("username");
        const userElementsSize = elements.filter((element) => element.username === username).length;
        const element = createElement(clientX, clientY, clientX, clientY, elementType, userElementsSize);
        setElements((elements) => [...elements, element]);
    }

    const mouseUpEvent = () => {
            const element = elements[elements.length - 1];
            socket.emit('canvas-data', {element, roomId, username: window.sessionStorage.getItem("username")});        
        setAction(false);
    }

    const mouseMoveEvent = (event) => {
        if(!action) return;
        const { clientX, clientY } = event;
        const index = elements.length - 1;
        const stateCopy = [...elements];

        if(elementType === 'pen') {
            stateCopy[index].points = [...stateCopy[index].points, {x: clientX, y: clientY}];
        } else {
            const {x1, y1} = elements[index];
            const element = createElement(x1, y1, clientX, clientY, elementType, stateCopy[index].id);
            stateCopy[index] = element;
        }
        setElements(stateCopy);
    }

    const createElement = (x1, y1, x2, y2, tool, id) => {
        if(tool === 'pen') {
            return { 
                points: [{ x: x1, y: y1 }], 
                color: colorRef.current.value, 
                size: sizeRef.current.value, 
                username: window.sessionStorage.getItem("username"),
                type: tool,
                id
            };
        } else {
            return { 
                x1, y1, 
                x2, y2, 
                color: colorRef.current.value, 
                size: sizeRef.current.value, 
                username: window.sessionStorage.getItem("username"),
                type: tool,
                id
            };
        }
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

