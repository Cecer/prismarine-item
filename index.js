module.exports = loader

let versionCache = {};
function loader (mcVersion) {
  if (versionCache[mcVersion] === undefined) {
    let mcData = require('minecraft-data')(mcVersion);
    let version = mcData.version.majorVersion;
    let versioned = {
      findItemOrBlockById: mcData.findItemOrBlockById,
    };

    versionCache[mcVersion] = class extends Item {
      constructor(type, count, metadata, nbt) {
        super(type, count, metadata, nbt, versioned);
      }
      static toNotch (item) {
        if (version === '1.13') {
          if (item == null) return {present: false}
          const notchItem = {
            present: true,
            itemId: item.type,
            itemCount: item.count
          }
          if (item.nbt && item.nbt.length !== 0) { notchItem.nbtData = item.nbt }
          return notchItem
        } else {
          if (item == null) return {blockId: -1}
          const notchItem = {
            blockId: item.type,
            itemCount: item.count,
            itemDamage: item.metadata
          }
          if (item.nbt && item.nbt.length !== 0) { notchItem.nbtData = item.nbt }
          return notchItem
        }
      }
      
      static fromNotch (item) {
        if (version === '1.13') {
          if (item.present === false) return null
          return new versionCache[mcVersion](item.itemId, item.itemCount, item.nbtData)
        } else {
          if (item.blockId === -1) return null
          return new versionCache[mcVersion](item.blockId, item.itemCount, item.itemDamage, item.nbtData)
        }
      }
      
      static equal (item1, item2) {
        if (item1 == null && item2 == null) {
          return true
        } else if (item1 == null) {
          return false
        } else if (item2 == null) {
          return false
        } else {
          return item1.type === item2.type &&
            item1.count === item2.count &&
            item1.metadata === item2.metadata
        }
      }
    };
    Object.defineProperty (versionCache[mcVersion], "name", {value: `Item_${mcVersion.replace(/\./g, "_")}`});
  }
  return versionCache[mcVersion];
}

const assert = require('assert')

function Item (type, count, metadata, nbt, versioned) {
  if (type == null) return

  if (metadata instanceof Object && metadata !== null) {
    nbt = metadata
    metadata = 0
  }

  this.type = type
  this.count = count
  this.metadata = metadata == null ? 0 : metadata
  this.nbt = nbt || null

  const itemEnum = versioned.findItemOrBlockById(type)
  assert.ok(itemEnum, 'item with id ' + type + ' not found')
  this.name = itemEnum.name
  this.displayName = itemEnum.displayName
  if ('variations' in itemEnum) {
    for (var i in itemEnum['variations']) {
      if (itemEnum['variations'][i].metadata === metadata) { this.displayName = itemEnum['variations'][i].displayName }
    }
  }
  this.stackSize = itemEnum.stackSize
}
