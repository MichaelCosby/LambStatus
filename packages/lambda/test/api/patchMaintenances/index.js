// Code generated by generate-maintenance-handler. DO NOT EDIT.
/* eslint-disable */
import assert from 'assert'
import sinon from 'sinon'
import { handle } from 'api/patchMaintenances'
import SNS from 'aws/sns'
import MaintenancesStore from 'db/maintenances'
import MaintenanceUpdatesStore from 'db/maintenanceUpdates'
import { Maintenance, MaintenanceUpdate } from 'model/maintenances'
import { maintenanceStatuses } from 'utils/const'
import { NotFoundError } from 'utils/errors'

describe('patchMaintenances', () => {
  beforeEach(() => {
    sinon.stub(SNS.prototype, 'notifyEvent')
    sinon.stub(Maintenance.prototype, 'validateExceptEventID')
  })

  afterEach(() => {
    MaintenancesStore.prototype.get.restore()
    MaintenancesStore.prototype.update.restore()
    MaintenanceUpdatesStore.prototype.create.restore()
    MaintenanceUpdatesStore.prototype.query.restore()
    SNS.prototype.notifyEvent.restore()
    Maintenance.prototype.validateExceptEventID.restore()
  })

  const generateMaintenance = (maintenanceID) => {
    return new Maintenance({maintenanceID, name: 'name', status: maintenanceStatuses[0]})
  }

  const generateMaintenanceUpdates = ids => {
    return ids.map(id => new MaintenanceUpdate({maintenanceUpdateID: id}))
  }

  it('should update the maintenance', async () => {
    const maintenance = generateMaintenance('1')
    sinon.stub(MaintenancesStore.prototype, 'get').returns(maintenance)
    const updateMaintenanceStub = sinon.stub(MaintenancesStore.prototype, 'update').returns()

    const createMaintenanceUpdateStub = sinon.stub(MaintenanceUpdatesStore.prototype, 'create').returns()
    const maintenanceUpdates = generateMaintenanceUpdates(['1', '2'])
    sinon.stub(MaintenanceUpdatesStore.prototype, 'query').returns(maintenanceUpdates)

    const event = { params: { maintenanceid: '1' }, body: {name: 'test', status: maintenanceStatuses[0]} }
    await handle(event, null, (error, result) => {
      assert(error === null)

      assert(result.maintenanceID !== undefined)
      assert(result.maintenanceUpdates.length === 2)
      assert(result.maintenanceUpdates[0].maintenanceUpdateID !== undefined)
    })
    assert(updateMaintenanceStub.calledOnce)
    assert(updateMaintenanceStub.firstCall.args[0] instanceof Maintenance)

    assert(createMaintenanceUpdateStub.calledOnce)
    assert(createMaintenanceUpdateStub.firstCall.args[0] instanceof MaintenanceUpdate)
  })

  it('should return validation error if event body is invalid', async () => {
    const maintenance = generateMaintenance('1')

    sinon.stub(MaintenancesStore.prototype, 'get').returns(maintenance)
    sinon.stub(MaintenancesStore.prototype, 'update').returns()
    sinon.stub(MaintenanceUpdatesStore.prototype, 'create').returns()
    sinon.stub(MaintenanceUpdatesStore.prototype, 'query').returns()

    return await handle({ params: { maintenanceid: '1' }, body: { status: '' } }, null, (error, result) => {
      assert(error.match(/invalid/))
    })
  })

  it('should return not found error if id does not exist', async () => {
    sinon.stub(MaintenancesStore.prototype, 'get').throws(new NotFoundError())
    sinon.stub(MaintenancesStore.prototype, 'update').returns()
    sinon.stub(MaintenanceUpdatesStore.prototype, 'create').returns()
    sinon.stub(MaintenanceUpdatesStore.prototype, 'query').returns()

    return await handle({ params: { maintenanceid: '1' }, body: { status: '' } }, null, (error, result) => {
      assert(error.match(/not found/))
    })
  })

  it('should return error on exception thrown', async () => {
    sinon.stub(MaintenancesStore.prototype, 'get').throws()
    sinon.stub(MaintenancesStore.prototype, 'update').returns()
    sinon.stub(MaintenanceUpdatesStore.prototype, 'create').returns()
    sinon.stub(MaintenanceUpdatesStore.prototype, 'query').returns()

    return await handle({ params: { maintenanceid: '1' } }, null, (error, result) => {
      assert(error.match(/Error/))
    })
  })
})
