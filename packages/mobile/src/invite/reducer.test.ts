import { storeInviteeData } from 'src/invite/actions'
import { initialState, inviteReducer as reducer } from 'src/invite/reducer'
import { mockAccount, mockE164Number } from 'test/values'

describe('invite/reducer', () => {
  describe(reducer, () => {
    it('returns the default state', () => {
      expect(reducer(undefined, {} as any)).toEqual(initialState)
    })
  })

  describe(storeInviteeData, () => {
    it('stores the address-number object', () => {
      expect(reducer(initialState, storeInviteeData(mockAccount, mockE164Number))).toEqual({
        isSendingInvite: false,
        invitees: {
          [mockAccount]: mockE164Number,
        },
        redeemedInviteCode: '',
      })
    })
  })
})
