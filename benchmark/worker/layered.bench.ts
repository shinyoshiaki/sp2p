import { layeredBench } from "./layered";

const NODE_NUM = 20;
const GROUP_NUM = NODE_NUM / 2;

layeredBench(NODE_NUM, GROUP_NUM);