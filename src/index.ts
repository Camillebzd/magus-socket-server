import 'dotenv/config'
import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import RoomManager from './Managers/RoomManager';
import { RoomId } from './@types/Room';
import { Skill } from './@types/Skill';
import MonsterManager from './Managers/MonsterManager';
import AbilityManager from './Managers/AbilityManager';

async function main() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
    }
  });

  const PORT = 3020;

  const roomManager = new RoomManager(io);
  const monsterManager = new MonsterManager();
  const abilityManager = new AbilityManager();

  app.get('/', (req, res) => {
    res.status(200).send('Running');
  });

  // Listen to general connection event
  io.on('connection', (socket) => {
    console.log('a user connected');

    // MEMBER

    // Socket request to create a member (this is done after a user connect his wallets)
    // TODO add the player name here later instead of 'test'
    socket.on("createMember", (walletAddress) => {
      /**
       * This function adds the member to an interal list
       * of members and returns the created member.
       * This is not done at the socket creation but after the
       * user wallet connected.
       */
      const newMember = roomManager.createMember(walletAddress, 'test', socket);
      console.log("New member created:", newMember.uid, newMember.name);
      socket.emit('memberCreated', { uid: newMember.uid, name: newMember.name });
    });

    // Socket request to delete a member
    socket.on("deleteMember", (walletAddress) => {
      /**
       * This function delete the member to the interal list
       * of members.
       */
      if (roomManager.getMemberByID(walletAddress) !== null) {
        roomManager.removeMemberByMemberID(walletAddress);
        console.log("Member deleted:", walletAddress);
        socket.emit('memberDeleted', walletAddress);
      }
    });

    // ROOM

    // Socket request to create a room
    // for the moment the password can be empty
    socket.on("createNewRoom", (password: string) => {
      const member = roomManager.getMemberByConnectionID(socket.id);

      /**
       * Create a new room with uid base on the wallet of admin
       */
      const roomId = member.uid + '000' + Math.floor(Math.random() * 100) + 1;
      roomManager.addMemberToRoom(member, roomId, password);
      console.log('Room created:', { id: roomId, password });
      socket.emit('roomCreated', { id: roomId, password });
    });

    // Socket requests to be added to a room
    socket.on("joinRoom", ({ roomId, password }) => {
      const member = roomManager.getMemberByConnectionID(socket.id);

      try {
        // check if room exist first
        if (!roomManager.getRoomByID(roomId))
          throw Error("Can't join room: room doesn't exist.");
        roomManager.addMemberToRoom(member, roomId, password);
        socket.emit('roomJoined', { id: roomId, password });
      } catch (e) {
        console.log(e);
        socket.emit('error', e);
      }
    });

    // Socket requests to leave a room
    socket.on("leaveRoom", (roomId) => {
      const member = roomManager.getMemberByConnectionID(socket.id);

      roomManager.removeMemberFromRoom(member, roomId);
      socket.emit('roomLeft', roomId);
    });

    // User enters in the fight
    // Check if he is in the room before
    // listening to his spells
    socket.on("enterFight", (roomId: RoomId) => {
      // check if user is in the room
      const member = roomManager.getMemberByConnectionID(socket.id)
      const room = roomManager.getRoomByID(member.roomId);
      if (member.roomId == roomId) {
        // user is in the fight page
        // room.isInFight[member.uid] = true;
      } else {
        socket.emit('error', 'You are not in this room.');
        return;
      }
      // listen for futur spell selection
      socket.on("selectSkill", (skill: Skill) => {
        room.setSkill(member.uid, skill);
        // broadcast the skill to all in the room
        let skillData = {};
        skillData[member.uid] = skill;
        io.to(room.id).emit("skillSelected", skillData);
      });
      // broadcast all the members in the room, for the moment only members
      const members = room.getAllMembers(true);
      console.log('all entities:', members);
      io.to(room.id).emit("allEntities", members);
      // broadcast all the spell already selected
      const skills = room.getAllSkills();
      console.log('all skills:', skills);
      socket.emit("allSkillsSelected", skills);

      // check if all member of the room are in the fight then start the fight

    });
  });

  // init the managers
  await abilityManager.init()
  await monsterManager.init(abilityManager);

  server.listen(PORT, () => {
    console.log(`server running at http://localhost:${PORT}`);
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});