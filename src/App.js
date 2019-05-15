import React,{Component} from 'react';
import './App.css';
import axios from 'axios';

//constraits for game 
const HEIGHT = 500;
const WIDTH = 800;
const PIPE_WIDTH = 60;
const MIN_PIPE_HEIGHT = 40;
const FPS = 120;

//variables for scoreboard
let SCORE = 0;
let USERNAME = "";

//Bird Class
class Bird {
  constructor(ctx){
    this.ctx = ctx;
    this.x = 150;
    this.y = 150;
    this.gravity = 3;
    this.velocity = 0;
  }
  draw = () => {
    this.ctx.fillStyle = "orange";
    this.ctx.beginPath();
    this.ctx.arc(this.x,this.y,15,0,2*Math.PI);
    this.ctx.fill();
  }
  update = () => {
    //Bird move algorithm
    this.velocity += this.gravity;
    this.y += this.gravity + this.velocity*0.1;
  }
  jump = () =>{
    //get velocity for every jump
    this.velocity = -100;
  }
}

//Pipe Class
class Pipe{
  constructor(ctx,height, space){
    this.ctx = ctx;
    this.isDead = false;
    this.x = WIDTH;
    this.y = height ? HEIGHT - height : 0;
    this.width = PIPE_WIDTH;
    this.height = height || MIN_PIPE_HEIGHT + Math.random() * (HEIGHT - space - 2*MIN_PIPE_HEIGHT);
  }
  draw = () => {
    this.ctx.fillStyle = "#000";
    this.ctx.fillRect(this.x,this.y,this.width,this.height);
  }
  update = () => {
    this.x -= 1;
    if(this.x + PIPE_WIDTH< 0){
      this.isDead = true;
    }
    if(this.x + PIPE_WIDTH/2 === 150){
      SCORE++;
    }
  }
}

class Game extends Component {
  constructor(props){
    super(props);
    this.canvasRef = React.createRef();
    this.frameCount = 0;
    this.space = 120;
    this.pipes = [];
    this.birds = [];
    this.state = {
      scores: []
    };
  }
  componentDidMount() {
    document.addEventListener('keydown', this.onKeyDown);
    this.pipes = this.generatePipes();
    const ctx = this.getCtx();
    this.birds = [new Bird(ctx)];
    this.loop = setInterval(this.gameLoop, 1000 / FPS);
  }
  onKeyDown = (e) => {
    if(e.code === "Space"){
      this.birds[0].jump();
      
    }
  }
  getCtx = () => this.canvasRef.current.getContext("2d");
  generatePipes = () =>{
    const ctx = this.getCtx();

    const firstPipe = new Pipe(ctx,null,this.space)
    const secondPipeHeight = HEIGHT - firstPipe.height - this.space;
    const secondPipe = new Pipe(ctx,secondPipeHeight,this.space)
    return [firstPipe, secondPipe];
  }
  gameLoop = () => {
    this.update();
    this.draw();
    document.getElementById('scoreBoard').innerHTML = 'Score: ' + SCORE/2;
  }
  scoreBoard = async () => {
    const newScore = {
      username : USERNAME,
      score : SCORE / 2
    }
    await axios.post('http://localhost:3001/scores',newScore);
  }
  update = () =>{
    this.frameCount++;
    if(this.frameCount % 320 === 0) {
      const pipes = this.generatePipes();
      this.pipes.push(...pipes);
    }
    //update pipe positions
    this.pipes.forEach(pipe=> pipe.update())
    this.pipes = this.pipes.filter(pipe => !pipe.isDead);
    //update bird position
    this.birds.forEach(bird => bird.update())
    //detect collisions
    if(this.isGameOver()){
      document.getElementById('gameOver').innerHTML = "Game Over";
      this.scoreBoard();
      console.log(this.scores);
      clearInterval(this.loop);
    }
  }
  isGameOver = () => {
    let gameOver = false;
    this.birds.forEach(bird => {
      this.pipes.forEach(pipe => {
        if(
          bird.y < 0 || bird.y > HEIGHT || (bird.x > pipe.x && bird.x < pipe.x + pipe.width && 
          bird.y > pipe.y && bird.y < pipe.y +pipe.height)){
          gameOver = true;
        }
      })
    });
    return gameOver;
  }
  draw = () =>{
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    this.pipes.forEach(pipe => pipe.draw());
    this.birds.forEach(bird => bird.draw());
  }
  render(){
    return (
      <div className="App">
        <canvas
         ref={this.canvasRef}
         id="canvas" 
         width={WIDTH}
         height={HEIGHT}
         style={{marginTop:"30px",border:'1px solid #c3c3c3'}}></canvas>
         <h1 id="gameOver"></h1>
         <h2 id="scoreBoard"></h2>
      </div>
    );
  }
}

class App extends Component {
  state = {
    username : false,
    scores: []
  }
  getUsername = (e) => {
    e.preventDefault();
    USERNAME = e.target.username.value;
    console.log(USERNAME);
    this.setState({
      username :true
    })
  }
  componentDidMount() {
    this.getScores();
  }
  getScores = async () =>{
    const response = await axios.get('http://localhost:3001/scores');
    let sorted = [];
    
    response.data.forEach(data => {
      sorted.push([data.username,data.score]);
    })

    sorted = sorted.sort(function(a,b){
      return a[1] - b[1];
    });
    this.setState({
      scores : sorted.reverse()
    })
  }
  render() {
    return (
      <div style= {{textAlign:"center"}}>
        
        { !this.state.username ?
          <form style={{margin:"20px 5px"}} onSubmit={this.getUsername.bind(this)}>
            <h3>The game will start after entering the username!</h3>
            <label htmlFor="username" style={{fontSize:"18px"}}>Enter your username: </label>
            <input type="text" id="username"></input>
            <button type="submit">Submit</button>
          </form> 
          : null
        }
        {
          this.state.username ? 
            <h4>Good luck {USERNAME}!</h4>
           :null
        }
        {
          this.state.username ? <Game></Game> : null
        }
        {
          !this.state.scores.length == 0 ? 
          <table style={{textAlign:"center",margin:"10px auto"}}>
            <thead>
              <tr>
                <th>Place</th>
                <th>Username</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {
                  this.state.scores.map((score,index) => {
                    return(
                      <tr key={index}>
                      <th>{index+1}</th>
                      <th>{score[0]}</th>
                      <th>{score[1]}</th>
                      </tr>
                    )
                  })
              }
            </tbody>
          </table> : null
        }
        
      </div>
    )
  }
}


export default App;
