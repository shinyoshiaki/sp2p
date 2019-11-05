import { Meta, meta2URL } from "../../../entity/data/meta";

import { InjectServices } from "../..";
import { MainNetwork } from "../../../entity/network/main";
import { Navigator } from "../../../entity/actor/navigator";
import { Options } from "../../../adapter/actor";
import { Peer } from "../../../../vendor/kademlia";

export class NavigatorManager {
  private list: { [url: string]: Navigator } = {};

  createNavigator(
    services: InjectServices,
    meta: Meta,
    mainNet: MainNetwork,
    seederPeer: Peer,
    options: Options
  ) {
    const url = meta2URL(meta);
    if (this.isExist(url)) return this.list[url];

    this.list[url] = new Navigator(
      services,
      meta,
      mainNet,
      seederPeer,
      options
    );
    return this.list[url];
  }

  isExist(url: string) {
    return this.list[url] ? true : false;
  }
}
