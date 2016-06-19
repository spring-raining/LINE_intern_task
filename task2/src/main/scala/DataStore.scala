import com.redis.RedisClient

sealed case class DataStoreIndex(index: Int)

object DataStoreIndex {
  object undefined extends DataStoreIndex(-1)
  object constant extends DataStoreIndex(0)
  object main extends DataStoreIndex(1)
}

object DataStoreKeyFactory {
  val rootKey = "line_intern_task"

  object ConstantKeys {
    def keyOfOriginalForms = s"$rootKey:original_forms"
  }

  object MainKeys {
    def keyOfCandidateWords = s"$rootKey:candidate_words"
    def keyOfAnalyzedWords = s"$rootKey:analyzed_words"
    def keyOfCandidateUsers = s"$rootKey:candidate_users"
    def keyOfUserWord(userId: Long) = s"$rootKey:user:$userId:word"
    def keyOfUserSampleTweet(userId: Long) = s"$rootKey:user:$userId:sample_tweet"
    def keyOfAnalyzedUsers = s"$rootKey:analyzed_users"
    def keyOfSupervisedUsers = s"$rootKey:supervised_users"
    def keyOfWeightedWords = s"$rootKey:weighted_words"
    def keyOfWordWeight(word: String) = s"$rootKey:weighted_word:$word:weight"
    def keyOfWordCount(word: String) = s"$rootKey:weighted_word:$word:count"
  }
}

object DataStore {
  def apply(domain: String, port: Int) = new DataStore(domain, port)
}

class DataStore(domain: String, port: Int) extends RedisClient {
  import DataStoreKeyFactory.ConstantKeys._
  import DataStoreKeyFactory.MainKeys._

  var dbIndex: DataStoreIndex = DataStoreIndex.undefined

  def candidateWord = new Iterator[String] {
    override def hasNext: Boolean = countCandidateWord >= 1
    override def next(): String = popCandidateWord().get
  }

  def candidateUserId = new Iterator[Long] {
    override def hasNext: Boolean = countCandidateUser >= 1
    override def next(): Long = popCandidateUser().get
  }

  def select(dataStoreIndex: DataStoreIndex) = {
    if (dataStoreIndex != dbIndex) {
      dbIndex = dataStoreIndex
      super.select(dataStoreIndex.index)
    }
  }

  /* init */

  def addNEologdOriginalForm(originalForm: String): Option[Long] = {
    select(DataStoreIndex.constant)
    sadd(keyOfOriginalForms, originalForm)
  }

  def isNEologdOriginalForm(originalForm: String): Boolean = {
    select(DataStoreIndex.constant)
    sismember(keyOfOriginalForms, originalForm)
  }

  def countNEologdOriginalForm: Long = {
    select(DataStoreIndex.constant)
    scard(keyOfOriginalForms).getOrElse(0L)
  }

  /* main */

  def addCandidateWord(word: String): Option[Long] = {
    select(DataStoreIndex.main)
    hincrby(keyOfCandidateWords, word, 1)
  }

  def popCandidateWord(): Option[String] = {
    select(DataStoreIndex.main)
    hgetall(keyOfCandidateWords) match {
      case Some(hash) if hash.nonEmpty => {
        val max = hash.values.map(_.toInt).max
        val word = hash.filter(t => t._2.toInt == max).head._1
        hdel(keyOfCandidateWords, word)
        Some(word)
      }
      case _ => None
    }
  }

  def countCandidateWord: Long = {
    select(DataStoreIndex.main)
    hlen(keyOfCandidateWords).getOrElse(0L)
  }

  def addAnalyzedWord(word: String) = {
    select(DataStoreIndex.main)
    sadd(keyOfAnalyzedWords, word)
  }

  def removeAnalyzedWord(word: String) = {
    select(DataStoreIndex.main)
    srem(keyOfAnalyzedWords, word)
  }

  def isAnalyzedWord(word: String): Boolean = {
    select(DataStoreIndex.main)
    sismember(keyOfAnalyzedWords, word)
  }

  def countAnalyzedWord: Long = {
    select(DataStoreIndex.main)
    scard(keyOfAnalyzedWords).getOrElse(0L)
  }

  def addCandidateUser(userId: Long): Option[Long] = {
    select(DataStoreIndex.main)
    sadd(keyOfCandidateUsers, userId)
  }

  def popCandidateUser(): Option[Long] = {
    select(DataStoreIndex.main)
    spop(keyOfCandidateUsers).map(_.toLong)
  }

  def countCandidateUser: Long = {
    select(DataStoreIndex.main)
    scard(keyOfCandidateUsers).getOrElse(0L)
  }

  def addUserWords(userId: Long, words: Seq[String]) = {
    select(DataStoreIndex.main)
    set(keyOfUserWord(userId), words.mkString("\t"))
  }

  def getUserWords(userId: Long): Option[Seq[String]] = {
    select(DataStoreIndex.main)
    get(keyOfUserWord(userId)).map(_.split('\t'))
  }

  def addUserSampleTweetURL(userId: Long, tweetURL: String) = {
    select(DataStoreIndex.main)
    set(keyOfUserSampleTweet(userId), tweetURL)
  }

  def getUserSampleTweetURL(userId: Long) = {
    select(DataStoreIndex.main)
    get(keyOfUserSampleTweet(userId))
  }

  def addAnalyzedUser(userId: Long) = {
    select(DataStoreIndex.main)
    sadd(keyOfAnalyzedUsers, userId)
  }

  def removeAnalyzedUser(userId: Long) = {
    select(DataStoreIndex.main)
    srem(keyOfAnalyzedUsers, userId)
  }

  def isAnalyzedUser(userId: Long): Boolean = {
    select(DataStoreIndex.main)
    sismember(keyOfAnalyzedUsers, userId)
  }

  def countAnalyzedUser: Long = {
    select(DataStoreIndex.main)
    scard(keyOfAnalyzedUsers).getOrElse(0L)
  }

  def getAnalyzedUsers: Set[Long] = {
    select(DataStoreIndex.main)
    smembers(keyOfAnalyzedUsers)
      .getOrElse(Set())
      .flatten
      .map(_.toLong)
  }

  def addSupervisedUser(userId: Long) = {
    select(DataStoreIndex.main)
    sadd(keyOfSupervisedUsers, userId)
  }

  def getSupervisedUsers: Set[Long] = {
    select(DataStoreIndex.main)
    smembers(keyOfSupervisedUsers)
      .getOrElse(Set())
      .flatten
      .map(_.toLong)
  }

  def deleteSupervisedUsers() = {
    select(DataStoreIndex.main)
    del(keyOfSupervisedUsers)
  }

  def updateWordWeight(word: String, weight: Float, count: Int = 1): Float = {
    select(DataStoreIndex.main)
    sadd(keyOfWeightedWords, word)

    (get(keyOfWordWeight(word)), get(keyOfWordCount(word))) match {
      case (Some(w), Some(c)) => {
        val newNum = (weight * count + w.toFloat * c.toInt) / (count + c.toInt)
        set(keyOfWordWeight(word), newNum)
        incrby(keyOfWordCount(word), count)
        newNum
      }
      case _ => {
        set(keyOfWordWeight(word), weight)
        set(keyOfWordCount(word), count)
        weight
      }
    }
  }

  def getWordWeight(word: String): Option[Float] = {
    select(DataStoreIndex.main)
    get(keyOfWordWeight(word)).map(_.toFloat)
  }

  def getWordCount(word: String): Option[Long] = {
    select(DataStoreIndex.main)
    get(keyOfWordCount(word)).map(_.toLong)
  }

  def countWeightedWord: Long = {
    select(DataStoreIndex.main)
    scard(keyOfWeightedWords).getOrElse(0L)
  }

  def getWeightedWords: Set[String] = {
    select(DataStoreIndex.main)
    smembers(keyOfWeightedWords)
      .getOrElse(Set())
      .flatten
  }
}
