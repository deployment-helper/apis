/**
 * DTO for scene content
 */
export class SceneContentDto {
  content: Record<string, any>;
}

/**
 * DTO for creating a new scene
 */
export class CreateSceneDto {
  description: string;
  layoutId: string;
  image?: string;
  content?: Record<string, any>;
}

/**
 * DTO for updating an existing scene
 */
export class UpdateSceneDto {
  description?: string;
  layoutId?: string;
  image?: string;
  content?: Record<string, any>;
}

/**
 * DTO for updating multiple scenes
 */
export class UpdateScenesDto {
  scenes: UpdateSceneDto[];
}

/**
 * DTO for changing scene position
 */
export class ChangeScenePositionDto {
  newPosition: number;
}
