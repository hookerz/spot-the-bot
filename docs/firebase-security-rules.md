```js
{
  "rules": {
    // Users are full public. Anyone can create one.
    "users": {
      ".read": "true",
      ".write": "true",
    },
    // Rooms are readale as long as you know the room ID. Users
    // attempt to create a room by writing a boolean to it; it
    // will be rejected if the room already exists.
    "rooms": {
      "$room_id": {
      	".read": "true",
        ".write": "!data.exists() || !newData.exists()",
        ".validate": "newData.isBoolean()"
      }
    },
    // Gamestates are readable as long as you know the room ID.
    "gamestate": {
      "$room_id": {
        ".read": "true",
        ".write": "root.child('rooms/' + $room_id).exists()",
      }
    },
    "gamestate-actions": {
      "$room_id": {
        ".read": "true",
        ".write": "root.child('rooms/' + $room_id).exists()",
      }
    },
    // Player roles are readable as long as you know the room ID.
    "players": {
      "$room_id": {
        ".read": "true",
        ".write": "root.child('rooms/' + $room_id).exists()",
      }
    }
  }
}
```
