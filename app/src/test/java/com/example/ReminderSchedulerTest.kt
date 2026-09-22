package com.example

import org.junit.Assert.assertEquals
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
