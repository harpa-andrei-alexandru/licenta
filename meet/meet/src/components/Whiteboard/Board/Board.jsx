import React from 'react';
import './style.css';


class Board extends React.Component {
 
    timeout;
    resizeTimeout;
    ctx;
    offsetX;
    offsetY;
    isDrawing = false;
    constructor(props) {
        super(props);

        props.socket.on('canvas-data', function(data) {
            var image = new Image();
            var canvas = document.querySelector('canvas');
            var ctx = canvas.getContext('2d');
            image.onload = function() {
                ctx.drawImage(image, 0, 0);
            }
            image.src = data;
        })
    }

    componentDidMount() {
        console.log(this.props);
        var canvas = document.querySelector('#board');

        var sketch = document.querySelector('#sketch');
        var sketch_style = getComputedStyle(sketch);

        canvas.width = parseInt(sketch_style.getPropertyValue('width'));
        canvas.height = parseInt(sketch_style.getPropertyValue('height'));
        
        this.drawOnCanvas();
        window.addEventListener('resize', () => {
            this.ctx = canvas.getContext('2d');
            var ctx = this.ctx;

            //sketch.style.overflowX="scroll";
            //sketch.style.overflowY="scroll";

            canvas.width = parseInt(sketch_style.getPropertyValue('width'));
            canvas.height = parseInt(sketch_style.getPropertyValue('height'));

            ctx.lineWidth = this.props.size;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.strokeStyle = this.props.color.value;

            this.props.socket.emit("refresh-data", "da");
        });
    }

    componentWillReceiveProps(newProps) {
        this.ctx.strokeStyle = newProps.color;
        this.ctx.lineWidth = newProps.size;
    }

    drawOnCanvas() {
        var canvas = document.querySelector('#board');

        var sketch = document.querySelector('#sketch');
        var sketch_style = getComputedStyle(sketch);

        this.ctx = canvas.getContext('2d');
        var ctx = this.ctx;


        canvas.width = parseInt(sketch_style.getPropertyValue('width'));
        canvas.height = parseInt(sketch_style.getPropertyValue('height'));

        var mouse = {x: 0, y: 0};
        var last_mouse = {x: 0, y: 0};
    
        /* Mouse Capturing Work */
        canvas.addEventListener('mousemove', function(e) {
            last_mouse.x = mouse.x;
            last_mouse.y = mouse.y;
    
            mouse.x = e.pageX - this.offsetLeft;
            mouse.y = e.pageY - this.offsetTop;
        }, false);
    
    
        /* Drawing on Paint App */
        console.log(this.props);
        ctx.lineWidth = this.props.size;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.strokeStyle = this.props.color.value;
    
        canvas.addEventListener('mousedown', function(e) {
            canvas.addEventListener('mousemove', onPaint, false);
        }, false);
    
        canvas.addEventListener('mouseup', function() {
            canvas.removeEventListener('mousemove', onPaint, false);
        }, false);
        
        var root = this;
        var onPaint = function() {
            console.log(root.props.color.value);
            ctx.beginPath();
            ctx.moveTo(last_mouse.x, last_mouse.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.closePath();
            ctx.stroke();

            if(root.timeout !== undefined) clearTimeout(root.timeout);
            root.timeout = setTimeout(function() {
                var base64ImageDate = canvas.toDataURL("image/png");
                root.props.socket.emit('canvas-data', base64ImageDate);
            }, 10);
        };
    }

    render() {
        return (
            <div className='sketch' id='sketch'>
                <div className='colorPickerContainer'>
                    Select Brush Color: &nbsp;
                    <input id='color' type='color'/>
                </div>

                <div className='brushSizeContainer'>
                    Select Brush Size: &nbsp;
                    <select >
                        <option value="5">5</option>
                        <option value="7">7</option>
                        <option value="9">9</option>
                        <option value="12">12</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                    </select>
                </div>
                <canvas className='board' id='board'></canvas>
            </div>
        );
    }
}

export default Board;