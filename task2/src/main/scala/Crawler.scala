import twitter4j._
import twitter4j.conf._

import scala.collection.JavaConversions._

object Crawler {
  def apply(dataStore: DataStore): Crawler = new Crawler(dataStore)
}

class Crawler(dataStore: DataStore) {

  val twitter = TwitterFactory.getSingleton

  val seedOfWord = "うどん"

  def run(): Unit = {

    if (dataStore.countCandidateUser == 0 && dataStore.countCandidateWord == 0) {
      dataStore.addCandidateWord(seedOfWord)
    }

    while (true) {
      // Search candidate phase
      dataStore.popCandidateWord().foreach(rootWord => {
        println()
        println(s"Fetching candidate users and words [rootWord: $rootWord] ...")
        dataStore.addAnalyzedWord(rootWord)
        fetchCandidateUsersAndWords(rootWord) match {
          case Some(result) => {
            result._1.foreach(userId => {
              if (!dataStore.isAnalyzedUser(userId)) {
                dataStore.addCandidateUser(userId)
              }
            })
            result._2.foreach(word => {
              if (!dataStore.isAnalyzedWord(word)) {
                dataStore.addCandidateWord(word)
              }
            })
          }
          case None =>  {
            dataStore.removeAnalyzedWord(rootWord)
          }
        }
      })

      // User word phase
      print("Fetching user words")
      dataStore.candidateUserId.foreach(userId => {
        dataStore.addAnalyzedUser(userId)
        fetchUserWordsAndSampleTweet(userId) match {
          case Some(result) => {
            print(".")
            dataStore.addUserWords(userId, result._1)
            dataStore.addUserSampleTweetURL(userId, result._2)
          }
          case None => {
            dataStore
          }
        }
      })
    }
  }

  def fetchCandidateUsersAndWords(rootWord: String): Option[(Set[Long], Seq[String])] = {
    val query = new Query(rootWord)
    query.setCount(15)
    query.setLang("ja")

    try {
      val queryResult = twitter.search(query)

      val result = queryResult.getTweets
        .filter(!_.isRetweet)
        .filter(status => {
          val ff = status.getUser.getFollowersCount.toDouble / status.getUser.getFriendsCount.toDouble
          ff > 0.3 && status.getUser.getFollowersCount > 10
        })

      val users = result.map(_.getUser.getId).toSet
      val words = result.flatMap(status => {
          val parsed = Mecab.parse(status.getText)
          parsed.map(_.originalForm)
            .filter(_ != "HTTPS")     // Exclude common url word
            .filter(str => dataStore.isNEologdOriginalForm(str))
        })
      Some(users, words)
    } catch {
      case err: TwitterException => onTwitterException(err)
      None
    }
  }

  def fetchUserWordsAndSampleTweet(userId: Long): Option[(Seq[String], String)] = {
    val paging = new Paging()
    paging.count(200)
    try {
      val userTimeline = twitter.getUserTimeline(userId, paging)

      val result = userTimeline
        .filter(!_.isRetweet)
      val maxFavoriteCount = result.map(_.getFavoriteCount).max

      val words = result.flatMap(status => {
        val parsed = Mecab.parse(status.getText)
        parsed.map(_.originalForm)
          .filter(_ != "HTTPS")     // Exclude common url word
          .filter(str => dataStore.isNEologdOriginalForm(str))
      })
      // Sample most favorited tweet URL
      val tweet = result
        .filter(_.getFavoriteCount == maxFavoriteCount)
        .map(status => s"https://twitter.com/${status.getUser.getScreenName}/status/${status.getId}")
        .headOption.getOrElse("https://twitter.com/")
      Some(words, tweet)
    } catch {
      case err: TwitterException => onTwitterException(err)
      None
    }
  }

  private def onTwitterException(twitterException: TwitterException) = {
    if (twitterException.getErrorCode == 88) {
      // Rate limit exceeded
      System.err.println("Rate limit exceeded; please wait a moment...")
    } else {

      System.err.println(twitterException.getErrorMessage)
    }
    Thread.sleep(120 * 1000)
  }
}
