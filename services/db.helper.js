'use strict'

function Timestamp(){
      return new Date(Math.floor(new Date().getTime()/1000)*1000);
}

module.exports = {
      Timestamp
}