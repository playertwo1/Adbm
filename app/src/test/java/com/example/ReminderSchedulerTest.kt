package com.example

import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ReminderSchedulerTest {
  @Test
  fun `snooze request identities include minutes and do not collide`() {
    assertNotEquals(
      ReminderScheduler.snoozeRequestCode("1", 1, 5),
      ReminderScheduler.snoozeRequestCode("1", 1, 15)
    )
    assertTrue(
      ReminderScheduler.snoozeRequestCode("1", 1, 5) !=
        ReminderScheduler.dailyRequestCode("1", 1)
    )
  }

  @Test
  fun `smart reminder publication requires enabled valid time and permission`() {
    assertTrue(ReminderScheduler.shouldPublishMindReminder(true, "15:30", true))
    assertFalse(ReminderScheduler.shouldPublishMindReminder(false, "15:30", true))
    assertFalse(ReminderScheduler.shouldPublishMindReminder(true, "garbage", true))
    assertFalse(ReminderScheduler.shouldPublishMindReminder(true, "15:30", false))
  }
}
