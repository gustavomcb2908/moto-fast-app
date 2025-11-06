import { createTRPCRouter } from '../../create-context';
import { listTraccarVehiclesProcedure } from './vehicles';

const traccarRouter = createTRPCRouter({
  list: listTraccarVehiclesProcedure,
});

export default traccarRouter;
