'use strict'

function getTimestamp(){
      return new Date(Math.floor(new Date().getTime()/1000)*1000);
}

function isEmpty(obj) {
      for(var prop in obj) {
            if(obj.hasOwnProperty(prop))
                  return false;
      }
  
      return true;
}

function convertToIds(array, property, isRoot) {
      
      if (isRoot) {
            let ids = [];

            array[property].forEach(id => {
                  ids.push({_id: id});
            })
            array[property] = ids;
            
      } else {
            array.forEach((item) => {
                  let ids = [];

                  item[property].forEach(id => {
                        ids.push({_id: id});
                  })
                  item[property] = ids;
            });
      }
}


module.exports = {
      getTimestamp,
      isEmpty,
      convertToIds
}