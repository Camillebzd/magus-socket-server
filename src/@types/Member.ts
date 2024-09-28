import { Socket } from "socket.io";

export type ID = string;    // in our case we will use the wallet address
export type Name = string;  // user can choose the name

export interface Instance {
  uid: ID;
  name: Name;
  roomId: string;
  connection: Socket;
  data: any;
}

// Instance used by the website so remove
// the socket because we can't store it in
// redux
export interface FrontInstance {
  uid: ID;
  name: Name;
  roomId: string;
  data: any;
}