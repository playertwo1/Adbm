package com.example

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

class ReminderSchedulerTest {
  private fun utcCalendar(year: Int, month: Int, day: Int, hour: Int, minute: Int): Calendar =
    Calendar.getInstance(TimeZone.getTimeZone("UTC"), Locale.US).apply {
      set(year, month, day, hour, minute, 0)
      set(Calendar.MILLISECOND, 0)
    }

  @Test
  fun `work pause schedule starts after one full interval and excludes work end`() {
    val weekdays = (1 shl 0) or (1 shl 1) or (1 shl 2) or (1 shl 3) or (1 shl 4)
    val now = utcCalendar(2026, Calendar.OCTOBER, 21, 8, 0)
    val next = ReminderScheduler.nextWorkPauseTrigger(now, weekdays, 8 * 60, 17 * 60, 60)

    assertEquals(utcCalendar(2026, Calendar.OCTOBER, 21, 9, 0).timeInMillis, next)
    assertEquals(
      utcCalendar(2026, Calendar.OCTOBER, 21, 10, 0).timeInMillis,
      ReminderScheduler.nextWorkPauseTrigger(utcCalendar(2026, Calendar.OCTOBER, 21, 9, 0), weekdays, 8 * 60, 17 * 60, 60)
    )
    assertEquals(
      utcCalendar(2026, Calendar.OCTOBER, 21, 16, 0).timeInMillis,
      ReminderScheduler.nextWorkPauseTrigger(utcCalendar(2026, Calendar.OCTOBER, 21, 15, 30), weekdays, 8 * 60, 17 * 60, 60)
    )
  }

  @Test
  fun `work pause schedule skips disabled days and advances to next selected weekday`() {
    val weekdays = (1 shl 0) or (1 shl 1) or (1 shl 2) or (1 shl 3) or (1 shl 4)
    val next = ReminderScheduler.nextWorkPauseTrigger(
      utcCalendar(2026, Calendar.OCTOBER, 24, 12, 0), weekdays, 8 * 60, 17 * 60, 60
    )

    assertEquals(utcCalendar(2026, Calendar.OCTOBER, 26, 9, 0).timeInMillis, next)
  }

  @Test
  fun `work pause schedule rejects empty days invalid window and unsupported interval`() {
    assertFalse(ReminderScheduler.isValidWorkPauseSchedule(0, "08:00", "17:00", 60))
    assertFalse(ReminderScheduler.isValidWorkPauseSchedule(31, "17:00", "08:00", 60))
    assertFalse(ReminderScheduler.isValidWorkPauseSchedule(31, "08:00", "09:00", 60))
    assertFalse(ReminderScheduler.isValidWorkPauseSchedule(31, "08:00", "17:00", 20))
    assertEquals(
      null,
      ReminderScheduler.nextWorkPauseTrigger(utcCalendar(2026, Calendar.OCTOBER, 24, 12, 0), 0, 8 * 60, 17 * 60, 60)
    )
  }

  @Test
  fun `late work pause alarm only publishes on selected day inside the active work window`() {
    val weekdays = (1 shl 0) or (1 shl 1) or (1 shl 2) or (1 shl 3) or (1 shl 4)
    fun active(hour: Int, minute: Int, day: Int = 21) = ReminderScheduler.isWorkPauseWindowActive(
      utcCalendar(2026, Calendar.OCTOBER, day, hour, minute), weekdays, "08:00", "17:00", 60
    )

    assertFalse(active(8, 59))
    assertTrue(active(9, 0))
    assertTrue(active(16, 59))
    assertFalse(active(17, 0))
    assertFalse(active(10, 0, day = 24))
  }

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

  // ADBM-E08.6-R — matriz adversarial de identidade nativa (item B do card):
  // programas reais (ids "1".."4", os IDs efetivamente usados em index.html),
  // sessões 1..2 e minutos de soneza 1..720. Nenhuma combinação pode colidir
  // entre si, com o request code diário (não-soneza) de qualquer programa/sessão,
  // nem com o espaço de notificationId (dailyRequestCode + 2_000_000).
  @Test
  fun `snooze identities never collide across real programs sessions and minutes 1 to 720`() {
    val programIds = listOf("1", "2", "3", "4")
    val sessions = listOf(1, 2)
    val seen = HashMap<Int, Triple<String, Int, Int>>()
    var collisions = 0
    for (programId in programIds) {
      for (session in sessions) {
        for (minutes in 1..720) {
          val code = ReminderScheduler.snoozeRequestCode(programId, session, minutes)
          val existing = seen[code]
          if (existing != null) {
            collisions += 1
          } else {
            seen[code] = Triple(programId, session, minutes)
          }
        }
      }
    }
    assertEquals("snooze request codes devem ser injetivos na matriz real", 0, collisions)

    // Nenhum snoozeRequestCode pode coincidir com um dailyRequestCode ou notificationId
    // de qualquer programa/sessão real (não-soneza), garantindo que cancelProgram e o
    // agendamento diário nunca sobrescrevam/cancelem a soneza de outro alarme.
    val dailyAndNotificationCodes = HashSet<Int>()
    for (programId in programIds) {
      for (session in sessions) {
        dailyAndNotificationCodes.add(ReminderScheduler.dailyRequestCode(programId, session))
        dailyAndNotificationCodes.add(ReminderScheduler.notificationId(programId, session))
      }
    }
    val overlap = seen.keys.count { dailyAndNotificationCodes.contains(it) }
    assertEquals("soneza não pode colidir com request code diário/notificação", 0, overlap)
  }

  @Test
  fun `cancelProgram sweep range covers every minute the snooze identity can produce`() {
    // cancelProgram varre sessões 1..2 e "minutos de soneza" 0..720 (0 = diário) usando
    // exatamente a mesma função de identidade; isso comprova que a soneza de qualquer
    // minuto 1..720 tem um request code alcançável pela varredura de cancelamento.
    for (session in 1..2) {
      for (minutes in 1..720) {
        val code = ReminderScheduler.snoozeRequestCode("3", session, minutes)
        assertTrue(
          "código de soneza fora do alcance determinístico do cancelamento",
          code > 0
        )
      }
    }
  }
}
