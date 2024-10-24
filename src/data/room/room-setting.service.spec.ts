import { Test, TestingModule } from "@nestjs/testing";
import { RoomSettingService } from "./room-setting.service";

describe("RoomSettingService", () => {
   let service: RoomSettingService;

   beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
         providers: [RoomSettingService],
      }).compile();

      service = module.get<RoomSettingService>(RoomSettingService);
   });

   it("should be defined", () => {
      expect(service).toBeDefined();
   });
});
