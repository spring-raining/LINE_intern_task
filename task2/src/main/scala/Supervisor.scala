import twitter4j.TwitterFactory

import scala.io.StdIn
import scala.util.Random

object Supervisor {
  def apply(dataStore: DataStore): Supervisor = new Supervisor(dataStore)
}

class Supervisor(dataStore: DataStore) {
  val random = new Random
  val twitter = TwitterFactory.getSingleton

  def run(): Unit = {
    while (true) {
      popSupervisableUser() match {
        case Some(userId) => {
          val userWords = dataStore.getUserWords(userId).getOrElse(Seq())
          val userSampleTweet = dataStore.getUserSampleTweetURL(userId).getOrElse("")
          val wordCounts = (userWords.toSet: Set[String])
            .map(word => (word, userWords.count(_ == word)))
            .toMap

          println(userSampleTweet)
          print("Male or Female? (ex: 'm', 'f', 'mf', 'ffm') ")

          val score = StdIn.readLine() match {
            case input if input.contains('m') | input.contains('f') =>
              val m = input.toCharArray.count(_ == 'm')
              val f = input.toCharArray.count(_ == 'f)
              Some(m.toFloat / (m + f).toFloat)
            case _ =>
              None
          }
          score.foreach(s => {
            wordCounts.foreach(wc => {
              dataStore.updateWordWeight(wc._1, s, wc._2)
            })
          })

          println()
        }
        case None => {
          println("There is no supervisable user. Please run crawl command first!")
          return
        }
      }
    }
  }

  private def popSupervisableUser(): Option[Long] = {
    dataStore.getAnalyzedUsers match {
      case analyzedUsers if analyzedUsers.nonEmpty => {
        val supervisedUsers = dataStore.getSupervisedUsers
        val supervisingUserId = analyzedUsers.diff(supervisedUsers) match {
          case d if d.nonEmpty => {
            d.toVector
            d.toVector(random.nextInt(d.size))
          }
          case _ => {
            dataStore.deleteSupervisedUsers()
            analyzedUsers.toVector(random.nextInt(analyzedUsers.size))
          }
        }
        dataStore.addSupervisedUser(supervisingUserId)
        Some(supervisingUserId)
      }
      case _ => {
        None
      }
    }
  }
}
