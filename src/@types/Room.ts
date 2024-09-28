import * as Member from "./Member";
import { SkillsSelected, Skill } from "./Skill";

export type RoomId = string;

export const DefaultRoomId: RoomId = "unset";

// export interface Instance {
//   id: RoomId;
//   members: Map<Member.ID, Member.Instance>;
//   admin: Member.Instance;
//   password: string;
//   data: any;
// }

/**
 * Class representing a room. It handles the members and the fights.
 */
export class Room {
  readonly id: RoomId;
  readonly password: string;
  readonly admin: Member.Instance;
  readonly members: Map<Member.ID, Member.Instance>;
  readonly skillsSelected: SkillsSelected;

  constructor(id: RoomId, password: string, admin: Member.Instance) {
    this.id = id;
    this.password = password;
    this.admin = admin;
    this.members = new Map<Member.ID, Member.Instance>();
    this.skillsSelected = new Map<Member.ID, Skill>();
  }

  //////////////////////////////////

  /**
   * Set the skill choosed by a user
   * @launcher The id of the user
   * @skill The skill selected
   */
  setSkill(launcher: Member.ID, skill: Skill) {
    this.skillsSelected.set(launcher, skill);
  }

  /**
   * Return all the skill select by all the user in the room
   * 
   * @return an object where key is the member id and value the skill
   */
  getAllSkills(): { [id: Member.ID]: Skill} {
    const val: { [id: Member.ID]: Skill} = {};

    this.skillsSelected.forEach((value, key) => {
      val[key] = value;
    });
    return val;
  }

  /**
   * Return all the members in the room
   * 
   * @param [isForFront=false] Optionnal parameter to ask for a front instance of the members, false by default
   * @return an object containing an object with key represent the member id and value the value data
   */
    getAllMembers(isForFront: boolean = false): { [id: Member.ID]: Member.Instance | Member.FrontInstance} {
      const val: { [id: Member.ID]: Member.Instance | Member.FrontInstance } = {};
  
      this.members.forEach((value, key) => {
        if (isForFront)
          val[key] = this.convertMemberType(value);
        else
          val[key] = value;
      });
      return val;
    }

  //////////////////////////////////

  /**
   * Helper function that returns the member but with 
   * the FrontInstance type. It is used when you want to send
   * the member info to the front.
   * NOTE: this is not a new copy, if you modify it on the server it 
   * will modify the base instance.
   * 
   * @member Member Member instance to convert
   * @return Front instance of the member usable by the website
   */
  convertMemberType(member: Member.Instance): Member.FrontInstance {
    return {
      uid: member.uid,
      name: member.name,
      roomId: member.roomId,
      data: member.data
    };
  }
}