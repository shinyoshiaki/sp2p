import { InjectServices, injectServices } from "../service";

import { CreatePeer } from "../service/peer/createPeer";
import Kademlia from "../../vendor/kademlia";
import { MainNetwork } from "../entity/network/main";
import { NavigatorContainer } from "../usecase/actor/navigator";
import { PeerCreater } from "../module/peerCreater";
import { SeederContainer } from "../usecase/actor/seeder";
import { User } from "../usecase/actor/user";

export class SP2P {
  constructor(
    private modules: { PeerCreater: PeerCreater },
    private existKad?: Kademlia
  ) {}
  services: InjectServices = {
    ...injectServices(),
    CreatePeer: new CreatePeer({ PeerCreater: this.modules.PeerCreater })
  };
  mainNet = new MainNetwork(this.existKad);
  user = new User(this.services, this.mainNet);
  navigator = new NavigatorContainer(this.services, this.mainNet);
  seeder = new SeederContainer(this.services, this.mainNet);
}