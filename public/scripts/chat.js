let socket  = io.connect('https://chatTag.herokuapp.com');
    socket.on('send-username',async (event)=>{
      $.getJSON("/api/user_data",function(data){
        // if(error)
        //   console.log(error)
        console.log('Username: ' + data.username);
        socket.emit('username',data.username)
      });
    })

let message = document.getElementById('message'),
    sendMessage = document.getElementById('send'),
    output = document.getElementById('output');


sendMessage.addEventListener('click',async ()=>{
  let text ={
    from: '',
    message: message.value+" "
  };
  let data = await $.getJSON("/api/user_data")
    text.from=data.username
  socket.emit('chatMessage',text);
  output.innerHTML+=`<strong> ${text.from}: </strong> <em> ${text.message} </em> <br>`
  message.value="";
})

socket.on('message',function(data){
  output.innerHTML+=`<strong> ${data.from}: </strong> <em> ${data.message} </em> <br>`
})
