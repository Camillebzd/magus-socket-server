import { Server, Socket } from "socket.io";

// Types
import { Room, RoomId, DefaultRoomId } from "../@types/Room";
import * as Member from "../@types/Member";

////////////////////////////////////////////////////////////

/**
 * Class used to manage all the members and the rooms on the server.
 */
class RoomManager {
  private readonly _members: Map<Member.ID, Member.Instance>;
  private readonly _rooms: Map<RoomId, Room>;
  private readonly _server: Server;

  constructor(server: Server) {
    if (!server) {
      throw Error(
        "No server instance supplied in room manager constructor"
      );
    }

    this._members = new Map<Member.ID, Member.Instance>();
    this._rooms = new Map<RoomId, Room>();
    this._server = server;
  }

  //////////////////////////////////////////////////////////

  /**
   * Finds the room based on roomId
   * @param roomId
   * @returns a room if found otherwise undefined
   */
  getRoomByID(roomId: RoomId): Room | undefined {
    return this._rooms.get(roomId);
  }

  /**
   * Finds a member based on ID
   * @param memberID
   * @returns a member if found otherwise null
   */
  getMemberByID(memberID: Member.ID): Member.Instance | null {
    const retrievedMember = this._members.get(memberID);

    if (!retrievedMember) {
      return null;
      // throw Error(`No member found with id: ${memberID}`);
    }

    return retrievedMember;
  }

  /**
   * Finds a member based on ID
   * @param memberID
   * @returns a member if found otherwise null
   */
  getMemberByConnectionID(connectionID: Member.ID): Member.Instance | null {
    for (const [, member] of this._members) {
      if (member.connection.id === connectionID) {
        return member;
      }
    }

    return null;
  }

  //////////////////////////////////////////////////////////

  /**
   * Creates a member with the memberID
   * and socket connections
   * @param memberID id of the user, correspond to the user wallet address
   * @param name name choosed by the user
   * @param connection socket object of the user
   * @returns a new member instance
   */
  createMember(memberID: Member.ID, name: Member.Name, connection: Socket): Member.Instance {
    const newMember: Member.Instance = {
      uid: memberID,
      name,
      roomId: DefaultRoomId,
      connection,
      data: null
    };

    this._members.set(memberID, newMember);

    return newMember;
  }

  /**
   * Creates a room with the given roomId.
   * @param roomId
   * @returns a room instance
   */
  private createRoom(roomId: RoomId, admin: Member.Instance, password: string): Room {
    // const newRoom = {
    //   id: roomId,
    //   members: new Map<Member.ID, Member.Instance>(),
    //   admin,
    //   password,
    //   fightManager: new FightManager([admin]),
    //   data: null
    // };
    const newRoom = new Room(roomId, password, admin);

    this._rooms.set(roomId, newRoom);

    return newRoom;
  }

  //////////////////////////////////////////////////////////

  /**
   * Adds a member to the room. If the room doesn't
   * exist it will be created and the first member
   * become the admin of the room.
   * @param memberToAdd member(s) to add
   * @param roomId ID of the room
   * @param password password of the room
   */
  addMemberToRoom(
    memberToAdd: Member.Instance | Member.Instance[],
    roomId: RoomId,
    password: string
  ): void {
    let member: Member.Instance[] = [];
    let roomToAddMemberTo = this.getRoomByID(roomId);

    /**
     * Due to overloading we have multiple ways
     * to assign the variables
     */
    if (Array.isArray(memberToAdd)) {
      member = memberToAdd as Member.Instance[];
    } else if (typeof memberToAdd === "object") {
      member = [memberToAdd];
    }

    /**
     * Create the room if it doesn't exist yet
     * NOTE: The first member in the list is the admin of
     * the room
     */
    if (!roomToAddMemberTo) {
      roomToAddMemberTo = this.createRoom(roomId, member[0], password);
    } else {
      // check that the password correspond to the one on the room
      if (roomToAddMemberTo.password !== password)
        throw Error("Can't enter the room: password invalid");
    }
    /**
     * Add each member to the room, members
     * list and update their internal data
     */
    for (const newMemberOfRoom of member) {
      // Remove them from any room they could still be in
      if (newMemberOfRoom.roomId !== DefaultRoomId) {
        this.removeMemberFromRoom(newMemberOfRoom);
        newMemberOfRoom.connection.leave(newMemberOfRoom.roomId);
      }

      newMemberOfRoom.roomId = roomId;

      roomToAddMemberTo.members.set(newMemberOfRoom.uid, newMemberOfRoom);
      // roomToAddMemberTo.addMember(newMemberOfRoom);
      newMemberOfRoom.connection.join(roomId);

      this.addMemberToMemberList(newMemberOfRoom);
    }

    this._rooms.set(roomId, roomToAddMemberTo);
  }

  /**
   * Removes a member from a room and deletes
   * the room if it's empty.
   * @param memberID
   * @param roomId
   */
  removeMemberFromRoom(
    memberToRemove: Member.ID | Member.Instance | Member.Instance[],
    roomId?: RoomId
  ): void {
    let roomToRemoveID: RoomId;
    let memberList: Member.Instance[];

    ////////////////////////////////////////////////////////

    /**
     * Due to overloading we have multiple ways
     * to assign the variables
     */
    if (Array.isArray(memberToRemove)) {
      memberList = memberToRemove;
      roomToRemoveID = memberList[0].roomId;
    } else if (typeof memberToRemove === "object") {
      memberList = [memberToRemove];
      roomToRemoveID = memberToRemove.roomId;
    } else {
      if (!roomId) return;
      roomToRemoveID = roomId;

      const retrievedMember = this.getMemberByID(memberToRemove);
      if (!retrievedMember) return;

      memberList = [retrievedMember];
    }

    ////////////////////////////////////////////////////////

    const roomToRemoveMemberFrom = this.getRoomByID(roomToRemoveID);
    if (!roomToRemoveMemberFrom) {
      throw Error(`No room found with id: ${roomId}`);
    }

    // Go through all the members that need to be removed
    for (const member of memberList) {
      roomToRemoveMemberFrom.members.delete(member.uid);
      // roomToRemoveMemberFrom.removeMember(member.uid);

      // Update the member
      member.connection.leave(roomToRemoveID);
      member.roomId = DefaultRoomId;
      this._members.set(member.uid, member);
    }

    const updatedRoomSize = this.getRoomSize(roomToRemoveID);
    if (updatedRoomSize === 0) {
      console.log("Room deleted:", roomToRemoveID);
      this._rooms.delete(roomToRemoveID);
    }
  }

  //////////////////////////////////////////////////////////

  /**
   * Removes a member based on it's connection ID
   * @param connectionID
   */
  removeMemberByConnectionID(connectionID: string): void {
    for (const [, member] of this._members) {
      if (member.connection.id === connectionID) {
        this.removeMemberByMemberID(member.uid);
      }
    }
  }

  /**
   * Adds a member object to the member list
   * @param member
   */
  private addMemberToMemberList(member: Member.Instance): void {
    this._members.set(member.uid, member);
  }

  /**
   * Removes a member based on the member ID
   * @param memberID
   */
  removeMemberByMemberID(memberID: Member.ID): void {
    this.removeMemberFromRoom(memberID);
    this._members.delete(memberID);
  }

  //////////////////////////////////////////////////////////

  /**
   * Returns the amount of members in a room.
   * Will return -1 if room wasn't found
   * @param roomId
   * @returns amount of members in a aroom
   */
  getRoomSize(roomId: RoomId): number {
    const retrievedRoom = this.getRoomByID(roomId);

    if (!retrievedRoom) {
      throw Error(`No room found with id: ${roomId}`);
    }

    const roomSize = retrievedRoom.members.size;

    return roomSize;
  }

  /**
   * Returns an array of members based on the room id.
   * Will return an empty array if the room doesn't exist
   * as rooms can only exist if there are members in them.
   *
   * Will return an empty array if no room is found
   * @param roomId
   * @returns Member.Instance[]
   */
  getRoomMembers(roomId: RoomId): Member.Instance[] {
    const retrievedRoom = this.getRoomByID(roomId);

    if (!retrievedRoom) {
      throw Error(`No room found with id: ${roomId}`);
    }

    // Only takes the values of a list
    const members = [...retrievedRoom.members.values()];

    return members;
  }

  //////////////////////////////////////////////////////////

  /**
   * Retrieve the data in a room based on it's room ID.
   *
   * Will return null if no room is found
   * @param roomId
   * @returns the data object of a room instance
   */
  // getRoomData<T>(roomId: RoomId): T {
  //   const retrievedRoom = this.getRoomByID(roomId);

  //   if (!retrievedRoom) {
  //     throw Error(`No room found with id: ${roomId}`);
  //   }

  //   const roomData = retrievedRoom.data;

  //   return roomData;
  // }

  /**
   * Sets the room data object of a room based
   * on the give room ID and data object
   * @param roomId
   * @param data
   * @returns
   */
  // setRoomData(roomId: RoomId, data: any): void {
  //   const retrievedRoom = this.getRoomByID(roomId);

  //   if (!retrievedRoom) {
  //     throw Error(`No room found with id: ${roomId}`);
  //   }

  //   retrievedRoom.data = data;

  //   this._rooms.set(roomId, retrievedRoom);
  // }

  /**
   * Retrieves the member data based on ID
   * @param memberId
   * @returns data
   */
  getMemberData<T>(memberId: Member.ID): T {
    const retrievedMember = this.getMemberByID(memberId);

    if (!retrievedMember) {
      throw Error(`No member found with id: ${memberId}`);
    }

    return retrievedMember.data;
  }

  /**
   * Sets the player data based on ID
   * @param memberID
   */
  setMemberData<T>(memberId: Member.ID, data: T): void {
    const retrievedMember = this.getMemberByID(memberId);

    if (!retrievedMember) {
      throw Error(`No member found with id: ${memberId}`);
    }

    retrievedMember.data = data;

    this._members.set(memberId, retrievedMember);
  }

  /**
   * Gets the admin of the room
   * @param roomId id of the room
   * @returns an instance of the member admin or throw an error
   * if the room doesn't exist
   */
  getAdminByRoomID(roomId: RoomId): Member.Instance {
    const retrievedRoom = this.getRoomByID(roomId);

    if (!retrievedRoom) {
      throw Error(`No room found with id: ${roomId}`);
    }
    return retrievedRoom.admin;
  }

  /**
   * Set an new admin for the room
   * @param roomId id of the room
   * @param newAdmin id of the room
   */
  // setAdminByRoomID(roomId: RoomId, newAdmin: Member.Instance): void {
  //   const retrievedRoom = this.getRoomByID(roomId);

  //   if (!retrievedRoom) {
  //     throw Error(`No room found with id: ${roomId}`);
  //   }
  //   retrievedRoom.admin = newAdmin;
  // }

  /// Logging //////////////////////////////////////////////

  logRoom(roomId: RoomId): void {
    const retrievedRoom = this.getRoomByID(roomId);

    if (!retrievedRoom) {
      throw Error(`No room found with id: ${roomId}`);
    }

    console.log(`Room ${roomId}`, retrievedRoom);
  }

  /// Attched server //////////////

  logServer(): void {
    const server = this._server;

    console.log("Server object", server.sockets.adapter.rooms);
  }

  /// Room internals //////////////

  // logRoomData(roomId: RoomId): void {
  //   const room = this.getRoomByID(roomId);
  //   if (!room) return;

  //   console.log(`Room data of room ${roomId}`, room.data);
  // }

  logRoomMembers(roomId: RoomId): void {
    const room = this.getRoomByID(roomId);
    if (!room) return;

    console.log(`All members of room ${roomId}`, room.members);
  }

  /// List logs //////////////

  logAllRooms(): void {
    const allRooms = this._rooms;
    console.log("All rooms: ", allRooms);
  }

  logAllMembers(): void {
    const allMembers = this._members;
    console.log("All members: ", allMembers);
  }
}

export default RoomManager;